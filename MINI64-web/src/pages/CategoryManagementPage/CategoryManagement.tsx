import PageBreadcrumb from "../../components/admin_component/common/PageBreadCrumb";
import PageMeta from "../../components/admin_component/common/PageMeta";
import EntityManagementPanel from "../../components/admin_component/catalog/EntityManagementPanel";

const apiUrl = import.meta.env.VITE_API_URL;

export default function CategoryManagement() {
  return (
    <>
      <PageMeta
        title="Quan ly danh muc | Mini64 Hobby Store"
        description="Trang admin them, sua, xoa danh muc"
      />
      <PageBreadcrumb pageTitle="Category Management" />
      <EntityManagementPanel
        title="Quan ly danh muc"
        description="Them, cap nhat va xoa danh muc de to chuc san pham."
        entityLabel="Category"
        entityLabelPlural="Categories"
        fetchUrl={`${apiUrl}/api/category/get-all`}
        createUrl={`${apiUrl}/api/category/create`}
        updateUrlBase={`${apiUrl}/api/category/update`}
        deleteUrlBase={`${apiUrl}/api/category/delete`}
        mediaFieldKey="image"
        mediaFieldLabel="Image"
      />
    </>
  );
}
