# Debug Community Creation API Errors

## Lỗi hiện tại

### 1. Lỗi 400 Bad Request
```
Failed to load resource: the server responded with a status of 400 ()
:7007/api/v1/groups:1
```

### 2. Lỗi API Error
```
[API Error] Error creating community: ▸ AxiosError
```

## Nguyên nhân có thể

### 1. **Format Data không đúng**
- API có thể yêu cầu format khác với những gì đang gửi
- Có thể thiếu required fields
- Có thể có validation rules khác

### 2. **Authentication Issues**
- Token có thể hết hạn
- Token có thể không đúng format
- Có thể cần quyền đặc biệt để tạo group

### 3. **API Endpoint Issues**
- Endpoint có thể không tồn tại
- Có thể cần endpoint khác
- Có thể cần HTTP method khác

## Debug Steps

### 1. Kiểm tra Console Logs
Mở Developer Tools và xem:
- Request data được gửi
- Response từ server
- Error details

### 2. Kiểm tra Network Tab
- Xem request headers
- Xem request body
- Xem response status và body

### 3. Test API trực tiếp
```bash
curl -X POST "https://localhost:7007/api/v1/groups" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "Test Community",
    "description": "Test description",
    "groupType": "Community"
  }'
```

## Solutions

### 1. **Tạm thời bỏ avatar**
```typescript
const requestData = {
    groupName: name.trim(),
    description: description.trim() || "",
    groupType: "Community" as const,
    groupAvatarUrl: undefined // Bỏ avatar tạm thời
};
```

### 2. **Thêm logging chi tiết**
```typescript
console.log("Creating community with data:", requestData);
console.log("API response:", response);
console.error("Full error object:", error);
```

### 3. **Kiểm tra API documentation**
- Xem API spec để biết đúng format
- Kiểm tra required fields
- Kiểm tra validation rules

### 4. **Test với Postman/Swagger**
- Test API trực tiếp với Postman
- Xem Swagger UI để biết đúng format
- Kiểm tra authentication

## Next Steps

1. **Chạy ứng dụng và test**
   ```bash
   npm run dev
   ```

2. **Mở Developer Tools**
   - Console tab để xem logs
   - Network tab để xem API calls

3. **Test tạo Community**
   - Điền form và submit
   - Xem console logs
   - Xem network requests

4. **Nếu vẫn lỗi**
   - Copy request data từ console
   - Test với curl/Postman
   - So sánh với API documentation

## Common Issues

### 1. **groupType không đúng**
- Đảm bảo `groupType: "Community"` (chính xác case)
- Không phải `"community"` hoặc `"COMMUNITY"`

### 2. **groupName quá ngắn/dài**
- Kiểm tra min/max length
- Đảm bảo không empty

### 3. **Authentication token**
- Kiểm tra token có valid không
- Kiểm tra token có quyền tạo group không

### 4. **API endpoint**
- Đảm bảo endpoint đúng: `/api/v1/groups`
- Đảm bảo HTTP method đúng: `POST`

## Fallback Solution

Nếu API không hoạt động, có thể tạm thời dùng mock data:

```typescript
// Mock response
const newCommunity: Community = {
    id: Date.now().toString(),
    groupId: Date.now().toString(),
    name: name.trim(),
    description: description.trim(),
    avatarUrl: avatarPreview,
    memberCount: 1,
    isAdmin: true
};

onCommunityCreated(newCommunity);
toast.success("Tạo cộng đồng thành công!");
```
