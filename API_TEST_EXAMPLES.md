# Hướng dẫn Test API Create Category

## Tổng quan

API tạo category sẽ tự động:
- **name**: Set từ `menuName`
- **slug**: Tự động tạo từ `menuName` (format: `about-us`)
- **key**: Tự động tạo từ `menuName` (format: `about_us`) - dùng cho frontend
- **name_vi, name_en, name_ko**: Tất cả được set bằng giá trị `menuName`

**Ví dụ**: `menuName: "About Us"` sẽ tạo:
- `name: "About Us"`
- `slug: "about-us"`
- `key: "about_us"` ← Frontend dùng key này

## 1. Test bằng Swagger UI

1. Mở Swagger UI tại: `http://localhost:8080/api-docs`
2. Tìm endpoint `POST /api/categories`
3. Click "Try it out"
4. Điền request body theo các ví dụ bên dưới
5. Click "Execute"

## 2. Test bằng cURL

### Ví dụ 1: Tạo Root Category (Category cấp cao nhất)

```bash
curl -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "menuName": "About Us",
    "description": "Introduction to our company",
    "status": "active",
    "sortOrder": 10
  }'
```

**Kết quả tự động tạo:**
- `name: "About Us"`
- `slug: "about-us"`
- `key: "about_us"` ← Frontend dùng key này
- `name_vi: "About Us"`
- `name_en: "About Us"`
- `name_ko: "About Us"`

### Ví dụ 2: Tạo Child Category (Category con/Submenu)

```bash
curl -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "menuName": "Company Overview",
    "description": "Overview of the company",
    "parent": "6912d9282df5d3d5dd5a0d8d",
    "status": "active",
    "sortOrder": 20
  }'
```

**Lưu ý**: 
- Thay `"6912d9282df5d3d5dd5a0d8d"` bằng ID thực của parent category
- Category con sẽ tự động được thêm vào `children` array của parent
- `key` sẽ được tạo: `"company_overview"`

### Ví dụ 3: Tạo Category với đầy đủ thông tin

```bash
curl -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "menuName": "Products",
    "description": "Our product catalog",
    "parent": "6912d9282df5d3d5dd5a0d8d",
    "status": "active",
    "sortOrder": 50,
    "metaTitle": "Products - Our Catalog",
    "metaDescription": "Browse our complete product catalog",
    "color": "#FF5733",
    "icon": "icon-products"
  }'
```

**Kết quả tự động tạo:**
- `name: "Products"`
- `slug: "products"`
- `key: "products"` ← Frontend dùng key này

### Ví dụ 4: Tạo Category đơn giản (chỉ cần menuName)

```bash
curl -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "menuName": "Contact",
    "status": "active"
  }'
```

**Kết quả tự động tạo:**
- `name: "Contact"`
- `slug: "contact"`
- `key: "contact"`
- `isActive: true` (mặc định)
- `sortOrder: 0` (mặc định)

## 3. Test bằng Postman

1. **Method**: POST
2. **URL**: `http://localhost:8080/api/categories`
3. **Headers**:
   - `Content-Type: application/json`
4. **Body** (raw JSON): Sử dụng các ví dụ ở trên

## 4. Các trường hợp test quan trọng

### Test Case 1: Tạo category mới và kiểm tra trong tree

**Bước 1**: Tạo category mới
```json
{
  "menuName": "Test Category",
  "description": "Category để test",
  "status": "active",
  "sortOrder": 999
}
```

**Bước 2**: Kiểm tra category xuất hiện trong tree
```bash
curl http://localhost:8080/api/categories/tree
```

**Kết quả mong đợi:**
- Category mới xuất hiện ngay trong response với `isActive: true`
- Có field `key` để frontend sử dụng
- Có đầy đủ `name_vi`, `name_en`, `name_ko` (tất cả = menuName)

### Test Case 2: Tạo child category

**Bước 1**: Lấy ID của parent category từ tree
```bash
curl http://localhost:8080/api/categories/tree
```

**Bước 2**: Tạo child category với parent ID
```json
{
  "menuName": "Child Test",
  "parent": "6912d9282df5d3d5dd5a0d8d",
  "status": "active"
}
```

**Bước 3**: Kiểm tra child category xuất hiện trong `children` array của parent
```bash
curl http://localhost:8080/api/categories/tree
```

### Test Case 3: Test validation

**Test thiếu menuName** (sẽ fail):
```json
{
  "description": "Missing menuName"
}
```

**Test với status inactive** (sẽ không xuất hiện trong tree):
```json
{
  "menuName": "Inactive Category",
  "status": "inactive"
}
```

## 5. Response mẫu

### Response thành công (201):
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "_id": "6912d9292df5d3d5dd5a0d92",
    "name": "About Us",
    "slug": "about-us",
    "key": "about_us",
    "name_vi": "About Us",
    "name_en": "About Us",
    "name_ko": "About Us",
    "description": "Introduction to our company",
    "isActive": true,
    "sortOrder": 10,
    "parent": null,
    "children": [],
    "createdAt": "2025-01-11T10:00:00.000Z",
    "updatedAt": "2025-01-11T10:00:00.000Z"
  }
}
```

**Các field quan trọng:**
- `key`: Frontend dùng để lookup translation hoặc routing (ví dụ: `"about_us"`)
- `slug`: Dùng cho URL (ví dụ: `"about-us"`)
- `name_vi`, `name_en`, `name_ko`: Tất cả được set từ `menuName`

### Response lỗi (400):
```json
{
  "success": false,
  "message": "menuName is required"
}
```

## 6. Kiểm tra kết quả

Sau khi tạo category thành công:

1. **Kiểm tra trong tree**:
   ```bash
   curl http://localhost:8080/api/categories/tree
   ```
   - Category mới sẽ xuất hiện với `isActive: true`
   - Kiểm tra có field `key` (ví dụ: `"about_us"`)
   - Kiểm tra có `name_vi`, `name_en`, `name_ko` (tất cả = menuName)

2. **Kiểm tra chi tiết category**:
   ```bash
   curl http://localhost:8080/api/categories/{category_id}
   ```
   Response sẽ bao gồm:
   - `key`: Field quan trọng cho frontend
   - `slug`: Dùng cho URL
   - `name_vi`, `name_en`, `name_ko`: Đa ngôn ngữ

3. **Kiểm tra nếu là child category**:
   - Category sẽ xuất hiện trong `children` array của parent khi gọi `/api/categories/tree`
   - Child category cũng có `key` riêng (ví dụ: `"company_overview"`)

## 7. Sử dụng key trong Frontend

Frontend có thể sử dụng `key` để:

1. **Lookup translation trong i18n**:
   ```javascript
   const translationKey = category.key; // "about_us"
   const translatedName = i18n.t(`menu.${translationKey}`);
   ```

2. **Routing/Navigation**:
   ```javascript
   const route = `/category/${category.key}`; // "/category/about_us"
   ```

3. **Dynamic menu rendering**:
   ```javascript
   categories.forEach(cat => {
     const menuItem = {
       key: cat.key,
       label: i18n.t(`menu.${cat.key}`),
       path: `/category/${cat.key}`
     };
   });
   ```

