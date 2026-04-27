import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import InvitationManagerPage from "./pages/InvitationManagerPage";

function App() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Navigate to="/invitations" replace />} />
        <Route path="/invitations" element={<InvitationManagerPage />} />
      </Route>
    </Routes>
  );
}

export default App;
