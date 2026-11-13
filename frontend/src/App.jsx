import { Link, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import HomePage from "./pages/HomePage.jsx";
import DormDetailPage from "./pages/DormDetailPage.jsx";
import DormitoryStatisticsPage from "./pages/DormitoryStatisticsPage.jsx";
import OwnerDormitoriesPage from "./pages/OwnerDormitoriesPage.jsx";
import OwnerDormitoryFormPage from "./pages/OwnerDormitoryFormPage.jsx";
import OwnerRoomsPage from "./pages/OwnerRoomsPage.jsx";
import ManageAccountPage from "./pages/ManageAccountPage.jsx";

// รองรับ FR-DOR-09 ถึง FR-DOR-12 และ AC-DOR-07 ถึง AC-DOR-08
export default function App() {
  return (
    <>
      <Navbar />
      <nav
        aria-label="เมนูการจัดการ"
        className="border-b border-sand px-6 py-3"
      >
        <Link
          to="/account"
          className="font-medium text-primary hover:underline"
        >
          จัดการบัญชี
        </Link>
        <Link
          to="/owner/dormitories"
          className="ml-6 font-medium text-primary hover:underline"
        >
          จัดการข้อมูลหอพัก
        </Link>
        <Link
          to="/owner/rooms"
          className="ml-6 font-medium text-primary hover:underline"
        >
          จัดการข้อมูลห้องพัก
        </Link>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/account" element={<ManageAccountPage />} />
          <Route path="/dorms/:id" element={<DormDetailPage />} />
          <Route path="/dorms/:id/statistics" element={<DormitoryStatisticsPage />} />
          <Route path="/owner/dormitories" element={<OwnerDormitoriesPage />} />
          <Route
            path="/owner/dormitories/new"
            element={<OwnerDormitoryFormPage />}
          />
          <Route
            path="/owner/dormitories/:dormitoryId/edit"
            element={<OwnerDormitoryFormPage />}
          />
          <Route path="/owner/rooms" element={<OwnerRoomsPage />} />
          <Route
            path="/owner/dormitories/:dormitoryId/rooms"
            element={<OwnerRoomsPage />}
          />
        </Routes>
      </main>
      <Footer />
    </>
  );
}