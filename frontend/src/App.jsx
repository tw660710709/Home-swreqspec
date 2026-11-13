import { Link, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import HomePage from "./pages/HomePage.jsx";
import DormDetailPage from "./pages/DormDetailPage.jsx";
import DormitoryStatisticsPage from "./pages/DormitoryStatisticsPage.jsx";
import OwnerDormitoriesPage from "./pages/OwnerDormitoriesPage.jsx";
import OwnerDormitoryFormPage from "./pages/OwnerDormitoryFormPage.jsx";

// รองรับ FR-DOR-09, FR-DOR-11 และ AC-DOR-07
export default function App() {
  return (
    <>
      <Navbar />
      <nav
        aria-label="เมนูจัดการข้อมูลหอพัก"
        className="border-b border-sand px-6 py-3"
      >
        <Link
          to="/owner/dormitories"
          className="font-medium text-primary hover:underline"
        >
          จัดการข้อมูลหอพัก
        </Link>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dorms/:id" element={<DormDetailPage />} />
          <Route path="/dorms/:id/statistics" element={<DormitoryStatisticsPage />} />
          <Route path="/owner/dormitories" element={<OwnerDormitoriesPage />} />
          <Route
            path="/owner/dormitories/:dormitoryId/edit"
            element={<OwnerDormitoryFormPage />}
          />
        </Routes>
      </main>
      <Footer />
    </>
  );
}