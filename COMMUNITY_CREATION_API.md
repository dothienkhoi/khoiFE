# Community Creation API Integration

## Tổng quan

Đã tích hợp thành công API POST `/api/v1/groups` để tạo Community mới trong phần Communities.

## API Endpoint

### Tạo Community mới
```
POST /api/v1/groups
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "groupName": "Tên cộng đồng",
  "description": "Mô tả cộng đồng",
  "groupType": "Community",
  "groupAvatarUrl": "string" // Tùy chọn
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo nhóm thành công.",
  "data": {
    "groupId": "fdaaa6f4-292c-487a-0a4f-08dde94566ea",
    "groupName": "Tên cộng đồng",
    "defaultConversationId": 13
  },
  "errors": null,
  "statusCode": 0
}
```

## Components đã được cập nhật

### 1. CreateCommunityDialog.tsx
- ✅ Tích hợp API `createGroup()` với `groupType: "Community"`
- ✅ Form validation với character limits
- ✅ Loading states và error handling
- ✅ Avatar upload preview (UI ready)
- ✅ Auto-close dialog sau khi tạo thành công
- ✅ Reset form sau khi tạo

### 2. CommunitiesSidebar.tsx
- ✅ Handle community creation callback
- ✅ Refresh communities list sau khi tạo
- ✅ Auto-select community mới tạo

## Tính năng đã implement

### ✅ Core Features
- [x] Tạo Community mới với API thật
- [x] Validation form (tên bắt buộc, giới hạn ký tự)
- [x] Avatar upload preview
- [x] Loading states
- [x] Error handling với toast notifications
- [x] Auto-refresh danh sách sau khi tạo

### ✅ Form Validation
- [x] Tên cộng đồng: Bắt buộc, tối đa 100 ký tự
- [x] Mô tả: Tùy chọn, tối đa 500 ký tự
- [x] Avatar: Tùy chọn, hỗ trợ JPG/PNG/GIF

### ✅ UI/UX Features
- [x] Character counter cho input fields
- [x] Loading spinner khi đang tạo
- [x] Disable form khi đang submit
- [x] Auto-close dialog sau khi thành công
- [x] Reset form khi đóng dialog

## Cách sử dụng

### 1. Mở dialog tạo Community
- Click nút "Tạo cộng đồng mới" trong sidebar Communities
- Hoặc click "Tạo cộng đồng đầu tiên" nếu chưa có community nào

### 2. Điền thông tin
- **Tên cộng đồng**: Bắt buộc, tối đa 100 ký tự
- **Mô tả**: Tùy chọn, tối đa 500 ký tự
- **Ảnh đại diện**: Tùy chọn, click "Chọn ảnh"

### 3. Tạo Community
- Click "Tạo cộng đồng"
- Hệ thống sẽ gọi API và tạo Community với `groupType: "Community"`
- Community mới sẽ xuất hiện ở đầu danh sách

## Error Handling

### API Error Handling
- Sử dụng `handleApiError()` utility function
- Toast notifications cho user
- Console logging cho developers
- Graceful fallbacks

### Validation Errors
- Tên cộng đồng không được để trống
- Giới hạn ký tự cho tên và mô tả
- Disable submit button khi form không hợp lệ

## API Integration Details

### Function: createGroup
```typescript
export const createGroup = async (data: {
    groupName: string;
    description?: string;
    groupType: "Private" | "Public" | "Community";
    groupAvatarUrl?: string;
}) => {
    const response = await customerApiClient.post("/groups", data);
    return response.data;
};
```

### Usage in CreateCommunityDialog
```typescript
const response = await createGroup({
    groupName: name.trim(),
    description: description.trim() || "",
    groupType: "Community", // Chỉ tạo Community
    groupAvatarUrl: avatarPreview || undefined
});
```

## Testing

### Manual Testing Checklist
- [ ] Mở dialog tạo Community
- [ ] Điền tên cộng đồng
- [ ] Điền mô tả (tùy chọn)
- [ ] Upload ảnh (tùy chọn)
- [ ] Submit form
- [ ] Kiểm tra loading state
- [ ] Kiểm tra success message
- [ ] Kiểm tra Community xuất hiện trong danh sách
- [ ] Test validation errors
- [ ] Test character limits

### API Testing
```bash
# Test create Community
curl -X POST "https://localhost:7007/api/v1/groups" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "Test Community",
    "description": "Test description",
    "groupType": "Community",
    "groupAvatarUrl": "string"
  }'
```

## Future Enhancements

### Planned Features
- [ ] File upload integration cho avatar
- [ ] Preview Community trước khi tạo
- [ ] Template Community cho các loại khác nhau
- [ ] Advanced validation rules
- [ ] Bulk Community creation

### API Improvements
- [ ] Add avatar upload endpoint
- [ ] Add Community templates
- [ ] Add Community categories
- [ ] Add Community settings

## Troubleshooting

### Common Issues
1. **Validation errors**: Kiểm tra tên không được để trống
2. **API errors**: Kiểm tra authentication token
3. **Character limits**: Kiểm tra giới hạn ký tự
4. **Network errors**: Kiểm tra API server có running không

### Debug Tips
- Mở Developer Tools để xem console logs
- Kiểm tra Network tab để xem API calls
- Sử dụng React DevTools để inspect component state
- Kiểm tra form validation errors
