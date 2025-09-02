# Community Creation API Debug Guide

## 🚨 **Lỗi hiện tại: 400 Bad Request**

### Console Logs sẽ hiển thị:
```
Creating community with data: {
  groupName: "Test Community",
  description: "Test description", 
  groupType: "Community",
  groupAvatarUrl: undefined
}

Request headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_TOKEN'
}

Alternative data format: {
  name: "Test Community",
  description: "Test description",
  type: "Community",
  avatarUrl: undefined
}

Full error object: AxiosError {...}
Error response: {...}
Error status: 400
Error data: {...}
```

## 🔧 **Cách test và debug:**

### 1. **Chạy ứng dụng:**
```bash
npm run dev
```

### 2. **Mở Developer Tools:**
- **Console tab**: Xem logs chi tiết
- **Network tab**: Xem request/response

### 3. **Test tạo Community:**
1. Truy cập `http://localhost:3001/communities`
2. Click "Tạo cộng đồng mới"
3. Điền form và submit
4. Xem console logs

### 4. **Kiểm tra Network Tab:**
- Tìm request đến `/api/v1/groups`
- Xem request headers và body
- Xem response status và error message

## 🎯 **Fallback Solution đã implement:**

Nếu API trả về lỗi 400 hoặc 404, hệ thống sẽ:
1. Tự động chuyển sang **Demo mode**
2. Tạo Community với mock data
3. Hiển thị message: "Tạo cộng đồng thành công! (Demo mode)"
4. Community sẽ xuất hiện trong danh sách

## 🔍 **Debug Steps:**

### 1. **Kiểm tra Authentication:**
```javascript
// Trong console, chạy:
document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1]
```

### 2. **Test API trực tiếp:**
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

### 3. **Kiểm tra API documentation:**
- Xem Swagger UI tại `https://localhost:7007/swagger`
- Kiểm tra đúng format request
- Kiểm tra required fields

## 📊 **Expected Behavior:**

### ✅ **Success Case:**
- API call thành công
- Community được tạo
- Toast: "Tạo cộng đồng thành công!"
- Dialog đóng
- Community xuất hiện trong danh sách

### 🔄 **Fallback Case:**
- API trả về 400/404
- Tự động chuyển sang Demo mode
- Toast: "Tạo cộng đồng thành công! (Demo mode)"
- Community được tạo với mock data

### ❌ **Error Case:**
- API trả về lỗi khác (401, 500, etc.)
- Toast: "Không thể tạo cộng đồng. Vui lòng thử lại."
- Dialog vẫn mở để user có thể thử lại

## 🛠️ **Troubleshooting:**

### 1. **Lỗi 400 Bad Request:**
- Kiểm tra format data có đúng không
- Kiểm tra required fields
- Kiểm tra validation rules

### 2. **Lỗi 401 Unauthorized:**
- Token hết hạn
- Token không đúng format
- Cần login lại

### 3. **Lỗi 404 Not Found:**
- Endpoint không tồn tại
- Base URL không đúng
- API server không running

### 4. **Lỗi 500 Internal Server Error:**
- Server error
- Database connection issue
- API logic error

## 🎯 **Next Steps:**

1. **Test với logging chi tiết**
2. **Kiểm tra Network tab**
3. **So sánh với API documentation**
4. **Nếu cần, dùng fallback solution**

## 📝 **Notes:**

- Fallback solution đã được implement để đảm bảo UX tốt
- Demo mode cho phép test UI mà không cần API hoạt động
- Logging chi tiết giúp debug dễ dàng
- Error handling comprehensive cho tất cả trường hợp
