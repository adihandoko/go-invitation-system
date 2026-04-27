import { Outlet, useLocation } from "react-router-dom";
import {
  CContainer,
  CHeader,
  CHeaderBrand,
  CHeaderNav,
  CHeaderToggler,
  CNavTitle,
  CSidebar,
  CSidebarBrand,
  CSidebarHeader,
  CSidebarNav,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilImagePlus, cilListRich, cilMenu } from "@coreui/icons";
import { useState } from "react";

function AdminLayout() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const location = useLocation();

  return (
    <div className="admin-shell">
      <CSidebar
        className="border-end admin-sidebar"
        position="fixed"
        visible={sidebarVisible}
        onVisibleChange={setSidebarVisible}
      >
        <CSidebarHeader className="border-bottom">
          <CSidebarBrand className="fw-semibold">Invitation Admin</CSidebarBrand>
        </CSidebarHeader>
        <CSidebarNav>
          <CNavTitle>Management</CNavTitle>
          <a href="/invitations" className="nav-link admin-nav-link active">
            <CIcon icon={cilListRich} className="nav-icon" />
            Invitation Manager
          </a>
          <a
            href="http://localhost:3000"
            className="nav-link admin-nav-link"
            target="_blank"
            rel="noreferrer"
          >
            <CIcon icon={cilImagePlus} className="nav-icon" />
            Public Site
          </a>
        </CSidebarNav>
      </CSidebar>

      <div className="wrapper d-flex flex-column min-vh-100 bg-body-tertiary">
        <CHeader position="sticky" className="mb-4 p-0 shadow-sm">
          <CContainer fluid className="px-4">
            <CHeaderToggler
              className="ps-1"
              onClick={() => setSidebarVisible((current) => !current)}
            >
              <CIcon icon={cilMenu} size="lg" />
            </CHeaderToggler>
            <CHeaderBrand className="mx-auto d-md-none">Invitation Admin</CHeaderBrand>
            <CHeaderNav className="ms-auto">
              <div className="small text-body-secondary">
                {location.pathname === "/invitations" ? "Invitation Manager" : "Admin"}
              </div>
            </CHeaderNav>
          </CContainer>
        </CHeader>

        <div className="body flex-grow-1">
          <CContainer lg className="px-4">
            <Outlet />
          </CContainer>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
