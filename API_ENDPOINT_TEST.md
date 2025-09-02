# Test API Endpoints for Community Groups

## 🔍 **Debug API Endpoints**

### 1. **Test /groups endpoint:**
```bash
curl -X GET "https://localhost:7007/api/v1/groups" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. **Test /me/groups endpoint:**
```bash
curl -X GET "https://localhost:7007/api/v1/me/groups" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. **Test POST /groups (đã thành công):**
```bash
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

## 📊 **Expected Response Format:**

### GET /groups hoặc /me/groups:
```json
{
  "success": true,
  "message": "Lấy danh sách nhóm thành công",
  "data": {
    "items": [
      {
        "groupId": "fdaaa6f4-292c-487a-0a4f-08dde94566ea",
        "groupName": "Test Community",
        "description": "Test description",
        "groupType": "Community",
        "groupAvatarUrl": "string",
        "memberCount": 1,
        "isAdmin": true
      }
    ],
    "pageNumber": 1,
    "pageSize": 10,
    "totalRecords": 1,
    "totalPages": 1
  }
}
```

## 🎯 **Current Issue:**

Communities sidebar không hiển thị Community groups vì:

1. **API endpoint có thể sai** - `/me/groups` vs `/groups`
2. **Response format có thể khác** - field names khác nhau
3. **Filter logic có thể sai** - `groupType` vs `GroupType`

## 🔧 **Debug Steps:**

### 1. **Kiểm tra Console Logs:**
```javascript
// Trong CommunitiesSidebar.tsx
console.log("API response for groups:", response);
console.log("All groups data:", groupsData);
console.log("Checking group:", group);
console.log("Group type:", group.groupType, group.GroupType);
```

### 2. **Kiểm tra Network Tab:**
- Xem request URL: `/groups` hay `/me/groups`
- Xem response status: 200, 401, 404?
- Xem response body: format data như thế nào

### 3. **Test với Postman/Swagger:**
- Test cả 2 endpoints
- So sánh response format
- Kiểm tra authentication

## 🛠️ **Solutions:**

### 1. **Nếu endpoint sai:**
- Thay đổi từ `/me/groups` sang `/groups`
- Hoặc thêm parameter để filter Community

### 2. **Nếu format khác:**
- Update field mapping trong filter logic
- Handle cả `groupType` và `GroupType`

### 3. **Nếu authentication issue:**
- Kiểm tra token có valid không
- Kiểm tra quyền truy cập groups

## 📝 **Next Steps:**

1. **Test cả 2 endpoints** với curl/Postman
2. **Xem console logs** để debug response
3. **Update filter logic** nếu cần
4. **Test tạo Community mới** và xem có hiển thị không
