# Error Fixes Documentation

## Lỗi đã được sửa

### 1. Runtime TypeError: Cannot read properties of null (reading 'toLowerCase')

**Nguyên nhân:**
- Lỗi xảy ra trong `GroupSidebar.tsx` khi filter groups
- Khi `group.groupName` hoặc `group.description` là `null` hoặc `undefined`
- Việc gọi `.toLowerCase()` trên giá trị null gây ra lỗi

**Cách sửa:**
- Sử dụng optional chaining (`?.`) để kiểm tra null/undefined
- Tạo utility function `safeToLowerCase()` để xử lý an toàn
- Thêm validation cho dữ liệu groups trước khi xử lý

**Code đã sửa:**
```typescript
// Trước (có lỗi)
group.groupName.toLowerCase().includes(searchTerm.toLowerCase())

// Sau (đã sửa)
safeToLowerCase(group.groupName).includes(safeToLowerCase(searchTerm))
```

### 2. SignalR Connection Error

**Nguyên nhân:**
- Server SignalR không khả dụng trong môi trường development
- Kết nối bị timeout hoặc server trả về lỗi
- Không có xử lý lỗi phù hợp

**Cách sửa:**
- Thêm timeout cho kết nối SignalR
- Cải thiện xử lý lỗi và retry logic
- Tắt SignalR trong development mode
- Thêm environment variable để control

**Code đã sửa:**
```typescript
// Thêm timeout cho connection
const connectionPromise = hubConnection.start();
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Connection timeout')), 10000)
);

await Promise.race([connectionPromise, timeoutPromise]);
```

## Cách ngăn chặn lỗi trong tương lai

### 1. Validation dữ liệu
- Luôn kiểm tra dữ liệu trước khi xử lý
- Sử dụng TypeScript strict mode
- Tạo utility functions cho validation

### 2. Error Handling
- Sử dụng try-catch blocks
- Log lỗi chi tiết để debug
- Cung cấp fallback values

### 3. Null Safety
- Sử dụng optional chaining (`?.`)
- Sử dụng nullish coalescing (`??`)
- Kiểm tra type trước khi gọi methods

### 4. API Error Handling
- Tạo utility function `handleApiError()`
- Xử lý lỗi nhất quán across app
- Cung cấp user-friendly error messages

## Environment Configuration

Để control SignalR connection, thêm vào file `.env.local`:

```env
# SignalR Configuration
NEXT_PUBLIC_ENABLE_SIGNALR=false

# API Configuration  
NEXT_PUBLIC_API_BASE_URL=https://localhost:7007
```

## Testing

Để test các fix:

1. **Test GroupSidebar:**
   - Tạo group với groupName = null
   - Tạo group với description = undefined
   - Test search functionality

2. **Test SignalR:**
   - Kiểm tra console logs
   - Verify connection không crash app
   - Test reconnection logic

## Monitoring

Để monitor lỗi trong production:

1. Sử dụng error tracking service (Sentry, LogRocket)
2. Log errors với context đầy đủ
3. Set up alerts cho critical errors
4. Monitor API response times và error rates

