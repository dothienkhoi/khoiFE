# Community API Integration Documentation

## Tổng quan

Đã tích hợp thành công API GET `/api/v1/groups/{groupId}/posts` để lấy danh sách bài viết trong nhóm Community và tạo giao diện hoàn chỉnh cho phần cộng đồng.

## API Endpoints được sử dụng

### 1. Lấy danh sách nhóm (Communities)
```
GET /api/v1/me/groups
```
- **Mục đích**: Lấy tất cả nhóm của user, filter ra các nhóm có `groupType === "Community"`
- **Response**: Danh sách các nhóm Community
- **Sử dụng trong**: `CommunitiesSidebar.tsx`

### 2. Lấy danh sách bài viết trong nhóm
```
GET /api/v1/groups/{groupId}/posts
```
- **Parameters**:
  - `groupId` (path): ID của nhóm
  - `PageNumber` (query): Số trang (mặc định: 1)
  - `PageSize` (query): Số bài viết mỗi trang (mặc định: 10)
  - `SearchTerm` (query, optional): Từ khóa tìm kiếm
  - `AuthorId` (query, optional): ID tác giả
- **Response**: Danh sách bài viết có phân trang
- **Sử dụng trong**: `CommunityPostsInterface.tsx`

### 3. Tạo bài viết mới
```
POST /api/v1/groups/{groupId}/posts
```
- **Body**:
  ```json
  {
    "title": "Tiêu đề bài viết",
    "contentMarkdown": "Nội dung bài viết",
    "attachmentFileIds": []
  }
  ```
- **Sử dụng trong**: `CommunityPostsInterface.tsx`

### 4. Like/Unlike bài viết
```
POST /api/v1/posts/{postId}/toggle-like
```
- **Sử dụng trong**: `CommunityPostsInterface.tsx`

## Components đã được cập nhật

### 1. CommunitiesSidebar.tsx
- ✅ Tích hợp API `getGroups()` để lấy danh sách nhóm Community
- ✅ Filter chỉ hiển thị nhóm có `groupType === "Community"`
- ✅ Loading states và error handling
- ✅ Search functionality
- ✅ Refresh data sau khi tạo nhóm mới

### 2. CommunityPostsInterface.tsx
- ✅ Tích hợp API `getGroupPosts()` để lấy bài viết
- ✅ Tích hợp API `createGroupPost()` để tạo bài viết mới
- ✅ Tích hợp API `togglePostLike()` để like/unlike
- ✅ Pagination với "Load More" functionality
- ✅ Refresh functionality
- ✅ Loading states và error handling
- ✅ File upload preview (UI ready)
- ✅ Real-time data mapping từ API response

### 3. CommunitiesPage.tsx
- ✅ Layout hoàn chỉnh với sidebar và content area
- ✅ Navigation giữa danh sách nhóm và chi tiết nhóm
- ✅ Responsive design

## Tính năng đã implement

### ✅ Core Features
- [x] Lấy danh sách nhóm Community từ API
- [x] Lấy danh sách bài viết trong nhóm với phân trang
- [x] Tạo bài viết mới
- [x] Like/Unlike bài viết
- [x] Search communities
- [x] Refresh data
- [x] Load more posts (pagination)

### ✅ UI/UX Features
- [x] Loading states cho tất cả API calls
- [x] Error handling với toast notifications
- [x] Empty states khi không có dữ liệu
- [x] Responsive design
- [x] Dark mode support
- [x] Smooth animations và transitions

### ✅ Data Mapping
- [x] Map API response sang interface Post
- [x] Handle multiple field name variations (camelCase, PascalCase)
- [x] Fallback values cho missing data
- [x] Date formatting (relative time)

## Cách sử dụng

### 1. Truy cập trang Communities
```
http://localhost:3000/communities
```

### 2. Chọn một Community
- Click vào community trong sidebar
- Sẽ hiển thị giao diện bài viết của community đó

### 3. Tạo bài viết mới
- Nhập nội dung vào textarea
- Click "Đăng bài"
- Bài viết sẽ được tạo và hiển thị ngay lập tức

### 4. Tương tác với bài viết
- Click "Thích" để like/unlike
- Click "Bình luận" (UI ready, chưa có API)
- Click "Chia sẻ" (UI ready, chưa có API)
- Click "Lưu" (UI ready, chưa có API)

## Error Handling

### API Error Handling
- Sử dụng `handleApiError()` utility function
- Toast notifications cho user
- Console logging cho developers
- Graceful fallbacks

### Network Error Handling
- Retry logic cho failed requests
- Loading states để tránh UI freeze
- Error boundaries cho component crashes

## Performance Optimizations

### Pagination
- Load 10 posts mỗi lần
- "Load More" button thay vì infinite scroll
- Reset pagination khi refresh

### Caching
- Local state management
- Optimistic updates cho like/unlike
- Refresh data sau khi tạo bài viết mới

## Future Enhancements

### Planned Features
- [ ] Comment system
- [ ] Share functionality
- [ ] Bookmark system
- [ ] File upload integration
- [ ] Real-time notifications
- [ ] Advanced search filters

### API Improvements
- [ ] Implement bookmark API
- [ ] Add comment APIs
- [ ] Add share APIs
- [ ] Add file upload APIs

## Testing

### Manual Testing Checklist
- [ ] Load communities list
- [ ] Search communities
- [ ] Select community
- [ ] Load posts
- [ ] Create new post
- [ ] Like/unlike post
- [ ] Load more posts
- [ ] Refresh posts
- [ ] Error handling
- [ ] Loading states
- [ ] Empty states

### API Testing
```bash
# Test get groups
curl -X GET "https://localhost:7007/api/v1/me/groups" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test get posts
curl -X GET "https://localhost:7007/api/v1/groups/{groupId}/posts?PageNumber=1&PageSize=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test create post
curl -X POST "https://localhost:7007/api/v1/groups/{groupId}/posts" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"","contentMarkdown":"Test post","attachmentFileIds":[]}'
```

## Troubleshooting

### Common Issues
1. **Posts không load**: Kiểm tra `groupId` có đúng không
2. **API errors**: Kiểm tra authentication token
3. **Empty communities**: Kiểm tra có nhóm nào có `groupType === "Community"` không
4. **Network errors**: Kiểm tra API server có running không

### Debug Tips
- Mở Developer Tools để xem console logs
- Kiểm tra Network tab để xem API calls
- Sử dụng React DevTools để inspect component state
