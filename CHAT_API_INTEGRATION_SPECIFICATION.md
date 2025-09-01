# Chat API Integration Specification

## 📋 Tổng quan
Tài liệu này mô tả chi tiết việc tích hợp Chat API cho tính năng trò chuyện trực tiếp (Direct Messages) trong dự án FastBite Group.

## 🔗 API Endpoints

### 1. Conversation List (Direct Messages)

#### **API Endpoint**
```
GET /api/v1/conversations/me?filter=direct
```

#### **Purpose**
- Lấy danh sách các cuộc trò chuyện trực tiếp (một-một)
- Hiển thị trong sidebar/chat list

#### **Response Structure**
```typescript
interface ConversationListResponse {
  success: boolean;
  data: Conversation[];
  message?: string;
}

interface Conversation {
  conversationId: string;
  displayName: string;
  avatarUrl?: string;
  lastMessagePreview: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  isOnline: boolean;
  userId: string;
}
```

#### **Usage**
- Hiển thị tất cả chat cá nhân trong Chat sidebar/list
- Mỗi item hiển thị: avatar + tên + preview tin nhắn cuối + thời gian + số tin nhắn chưa đọc

---

### 2. Open a Conversation

#### **Action**
Khi user click vào một người trong danh sách

#### **Behavior**
1. **Fetch conversation messages** (sử dụng conversation ID có sẵn)
2. **Display trong message panel:**
   - Messages căn trái/phải
   - Container cuộn dọc
   - Hiển thị tin nhắn theo thứ tự thời gian

#### **Message Display Logic**
```typescript
// Căn lề tin nhắn
const messageAlignment = message.senderId === currentUserId ? 'right' : 'left';

// Container cuộn
<ScrollArea className="h-full">
  {messages.map(message => (
    <ChatMessage 
      key={message.id}
      message={message}
      alignment={messageAlignment}
    />
  ))}
</ScrollArea>
```

---

### 3. Start a New Direct Conversation

#### **Action Flow**
Khi user click vào button "+" gần thanh tìm kiếm

#### **Step 1: Search Users**

**API Endpoint**
```
GET /api/v1/users/search?query={name_or_email}
```

**Purpose**
- Tìm kiếm user theo tên hoặc email
- Hiển thị kết quả dưới dạng danh sách

**Response Structure**
```typescript
interface UserSearchResponse {
  success: boolean;
  data: User[];
  message?: string;
}

interface User {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  isOnline: boolean;
}
```

**UI Display**
```typescript
// Hiển thị danh sách kết quả tìm kiếm
<div className="space-y-2">
  {searchResults.map(user => (
    <div 
      key={user.userId}
      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
      onClick={() => selectUserAndStartChat(user)}
    >
      <Avatar>
        <AvatarImage src={user.avatarUrl} />
        <AvatarFallback>{user.displayName[0]}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{user.displayName}</p>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>
    </div>
  ))}
</div>
```

#### **Step 2: Select User & Start Chat**

**API Endpoint**
```
POST /api/v1/conversations/direct
```

**Request Body**
```json
{
  "userId": "<target_user_id>"
}
```

**Purpose**
- Tìm hoặc tạo cuộc trò chuyện trực tiếp với user được chọn
- Nếu conversation đã tồn tại → trả về conversation hiện tại
- Nếu chưa có → tạo conversation mới

**Response Structure**
```typescript
interface CreateDirectConversationResponse {
  success: boolean;
  data: {
    conversationId: string;
    isNew: boolean;
    conversation: Conversation;
  };
  message?: string;
}
```

#### **Step 3: Update Chat List Immediately**

**After creating/finding conversation:**
1. **Refresh conversation list:**
   ```
   GET /api/v1/conversations/me?filter=direct
   ```
2. **Show new conversation instantly** trong Chat sidebar/list
3. **Auto-select** conversation mới được tạo

---

## 🎯 Expected UX Behavior

### **Smooth Transitions**
- Chuyển đổi mượt mà giữa conversation list ↔ message panel
- Loading states cho tất cả API calls
- Skeleton loading cho conversation list

### **Real-time Updates**
- Conversation mới xuất hiện trong list ngay lập tức (không reload)
- Cập nhật unread count real-time
- Hiển thị trạng thái online/offline

### **Responsive Search**
- Suggestions hiển thị khi user gõ
- Debounce search input (300ms delay)
- Highlight matching text trong kết quả tìm kiếm

---

## 🔧 Implementation Details

### **State Management**
```typescript
// Zustand store structure
interface ChatStore {
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  
  // Search
  searchQuery: string;
  searchResults: User[];
  isSearching: boolean;
  
  // Actions
  fetchConversations: () => Promise<void>;
  startDirectChat: (userId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  setActiveConversation: (conversationId: string) => void;
}
```

### **API Integration Functions**
```typescript
// lib/chat-api.ts
export const chatApi = {
  // Get conversations
  getConversations: async (filter: 'direct' | 'group' = 'direct') => {
    const response = await apiClient.get(`/api/v1/conversations/me?filter=${filter}`);
    return response.data;
  },

  // Search users
  searchUsers: async (query: string) => {
    const response = await apiClient.get(`/api/v1/users/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Start direct conversation
  startDirectChat: async (userId: string) => {
    const response = await apiClient.post('/api/v1/conversations/direct', { userId });
    return response.data;
  }
};
```

### **Error Handling**
```typescript
// Error handling patterns
try {
  const result = await chatApi.startDirectChat(userId);
  if (result.success) {
    // Handle success
    await refreshConversations();
    setActiveConversation(result.data.conversation.conversationId);
  } else {
    toast.error(result.message || 'Không thể tạo cuộc trò chuyện');
  }
} catch (error) {
  console.error('Error starting direct chat:', error);
  toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
}
```

---

## 📱 UI Components Structure

### **ChatSidebar.tsx**
```typescript
// Components/features/chat/ChatSidebar.tsx
export function ChatSidebar() {
  const { conversations, searchQuery, searchResults, isSearching } = useChatStore();
  
  return (
    <div className="w-80 border-r bg-white">
      {/* Header với Search + Button */}
      <div className="p-4 border-b">
        <h2>Trò chuyện</h2>
        <SearchInput 
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Tìm kiếm..."
        />
        <PlusButton onClick={openUserSearch} />
      </div>
      
      {/* Conversation List */}
      <ConversationList 
        conversations={conversations}
        onSelect={handleSelectConversation}
      />
      
      {/* User Search Results */}
      {searchQuery && (
        <UserSearchResults 
          results={searchResults}
          onSelect={handleSelectUser}
          isLoading={isSearching}
        />
      )}
    </div>
  );
}
```

### **ChatInterface.tsx**
```typescript
// Components/features/chat/ChatInterface.tsx
export function ChatInterface() {
  const { activeConversationId, activeConversation } = useChatStore();
  
  if (!activeConversationId) {
    return <EmptyChatState />;
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <ChatHeader conversation={activeConversation} />
      
      {/* Messages */}
      <MessageList conversationId={activeConversationId} />
      
      {/* Chat Input */}
      <ChatInput conversationId={activeConversationId} />
    </div>
  );
}
```

---

## 🚀 Performance Optimizations

### **Lazy Loading**
- Load conversations theo trang (pagination)
- Load messages theo chunk (20-50 messages mỗi lần)
- Virtual scrolling cho conversation list dài

### **Caching**
- Cache conversations trong Zustand store
- Cache user search results
- Debounce search requests

### **Real-time Updates**
- WebSocket/SignalR cho tin nhắn mới
- Polling cho conversation updates (fallback)
- Optimistic updates cho UI

---

## 📋 Testing Checklist

### **API Integration Tests**
- [ ] GET /api/v1/conversations/me?filter=direct
- [ ] GET /api/v1/users/search?query={query}
- [ ] POST /api/v1/conversations/direct
- [ ] Error handling cho tất cả endpoints

### **UI Component Tests**
- [ ] Conversation list rendering
- [ ] Search functionality
- [ ] User selection
- [ ] Chat interface switching
- [ ] Loading states

### **User Experience Tests**
- [ ] Smooth transitions
- [ ] Real-time updates
- [ ] Responsive search
- [ ] Error scenarios
- [ ] Loading performance

---

## 🔄 Future Enhancements

### **Phase 2 Features**
- Group conversations
- File sharing
- Voice messages
- Video calls
- Message reactions

### **Advanced Features**
- Message encryption
- Offline support
- Push notifications
- Message search
- Conversation archiving

---

*Document này mô tả chi tiết việc tích hợp Chat API cho FastBite Group. Sử dụng làm tài liệu tham khảo khi implement tính năng chat.*
