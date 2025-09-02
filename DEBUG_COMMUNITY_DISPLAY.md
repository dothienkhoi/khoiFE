# Debug Community Groups Display

## 🎯 **Mục tiêu:**
Hiển thị chỉ những nhóm có `GroupType = "Community"` trong Communities sidebar.

## 📊 **Dữ liệu từ Database:**
Từ SQL query, có các Community groups:
- "Quang" (GroupType: "Community")
- "Duy" (GroupType: "Community") 
- "Quang hay quá" (GroupType: "Community")

## 🔍 **Debug Steps:**

### 1. **Test API response:**
```javascript
// Trong console browser, chạy:
import { debugCommunityGroups } from '@/lib/customer-api-client';
debugCommunityGroups();
```

### 2. **Kiểm tra filter logic:**
```javascript
// Trong CommunitiesSidebar.tsx
console.log("Checking group:", group);
console.log("Group type:", group.groupType, group.GroupType);
```

### 3. **Expected console output:**
```
=== DEBUG COMMUNITY GROUPS ===
Full API response: { success: true, data: {...} }
All groups from API: [...]
Group 1: { id: "...", name: "Quang", type: "Community", description: "..." }
Group 2: { id: "...", name: "Duy", type: "Community", description: "..." }
Group "Quang": type="Community", isCommunity=true
Group "Duy": type="Community", isCommunity=true
Filtered Community groups: [...]
```

## 🛠️ **Possible Issues:**

### 1. **API không trả về Community groups:**
- Endpoint `/me/groups` có thể chỉ trả về groups của user
- Cần endpoint khác để lấy tất cả Community groups

### 2. **Field name khác nhau:**
- Database: `GroupType`
- API response: `groupType` hoặc `GroupType`
- Cần handle cả 2 cases

### 3. **Authentication issue:**
- User có thể không có quyền xem Community groups
- Token có thể không valid

## 🎯 **Solutions:**

### 1. **Nếu API không trả về Community groups:**
```typescript
// Thử endpoint khác
const response = await customerApiClient.get("/groups?type=Community");
```

### 2. **Nếu field name khác:**
```typescript
// Handle cả 2 field names
const groupType = group.groupType || group.GroupType;
const isCommunity = groupType === "Community";
```

### 3. **Nếu cần mock data:**
```typescript
// Tạm thời dùng mock data từ database
const mockCommunities = [
    {
        id: "132BB0B5-9E46-48A1-2904-08DDDE13C202",
        groupId: "132BB0B5-9E46-48A1-2904-08DDDE13C202", 
        name: "Quang",
        description: "Nhóm test bài đăng",
        avatarUrl: "string",
        memberCount: 1,
        isAdmin: true
    },
    {
        id: "47F98A86-7F2C-4083-A33D-08DDDF04B759",
        groupId: "47F98A86-7F2C-4083-A33D-08DDDF04B759",
        name: "Duy", 
        description: "hay quá",
        avatarUrl: "string",
        memberCount: 1,
        isAdmin: true
    }
];
```

## 📝 **Next Steps:**

1. **Chạy debug function** trong console
2. **Xem API response** có Community groups không
3. **Kiểm tra field names** trong response
4. **Update filter logic** nếu cần
5. **Test với mock data** nếu API không hoạt động

## 🎯 **Expected Result:**

Communities sidebar sẽ hiển thị:
- ✅ "Quang" (Community)
- ✅ "Duy" (Community)  
- ✅ "Quang hay quá" (Community)
- ❌ Không hiển thị "Private" hoặc "Public" groups
