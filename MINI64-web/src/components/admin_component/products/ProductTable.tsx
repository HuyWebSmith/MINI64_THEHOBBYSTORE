import React, { useState } from "react";

interface Product {
  id: number;
  image: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

const ProductTable: React.FC = () => {
  // Data mẫu - Sau này Huy dùng API thì fetch vào đây
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      image: "/images/product/product-01.png",
      name: "Hot Wheels Nissan Skyline",
      category: "Diecast",
      price: 55000,
      stock: 12,
    },
    {
      id: 2,
      image: "/images/product/product-02.png",
      name: "Takara Tomy Civic Type R",
      category: "Model Car",
      price: 150000,
      stock: 5,
    },
  ]);

  const handleDelete = (id: number) => {
    if (confirm("Huy chắc chắn muốn xóa sản phẩm này chứ?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-2 text-left dark:bg-meta-4">
            <th className="px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
              Sản phẩm
            </th>
            <th className="px-4 py-4 font-medium text-black dark:text-white">
              Danh mục
            </th>
            <th className="px-4 py-4 font-medium text-black dark:text-white">
              Giá
            </th>
            <th className="px-4 py-4 font-medium text-black dark:text-white">
              Tồn kho
            </th>
            <th className="px-4 py-4 font-medium text-black dark:text-white text-right">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-md border border-stroke p-1">
                    <img
                      src={product.image}
                      alt="product"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium text-black dark:text-white">
                    {product.name}
                  </p>
                </div>
              </td>
              <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                <p className="text-black dark:text-white">{product.category}</p>
              </td>
              <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                <p className="text-black dark:text-white">
                  {product.price.toLocaleString()}đ
                </p>
              </td>
              <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                <p className="text-black dark:text-white">{product.stock}</p>
              </td>
              <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark text-right">
                <div className="flex items-center justify-end space-x-3.5">
                  <button className="hover:text-primary text-blue-500">
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="hover:text-danger text-red-500"
                  >
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
