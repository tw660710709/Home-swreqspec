import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import HomePage from "./pages/HomePage.jsx";
import DormDetailPage from "./pages/DormDetailPage.jsx";
import DormitoryStatisticsPage from "./pages/DormitoryStatisticsPage.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dorms/:id" element={<DormDetailPage />} />
          <Route path="/dorms/:id/statistics" element={<DormitoryStatisticsPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}