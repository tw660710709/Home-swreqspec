import { NavLink, Link } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `pb-1 font-medium ${isActive ? "border-b-2 border-dark" : "hover:text-primary"}`;

export default function Navbar() {
  return (
    <header className="bg-cream">
      <nav className="flex w-full items-center justify-between px-6 py-5">
        <Link to="/" className="text-3xl font-bold">
          DORM-DEE (หอดี)
        </Link>
        <div className="flex items-center gap-8">
          <NavLink to="/" end className={linkClass}>หน้าแรก</NavLink>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dark text-white">
            K
          </div>
        </div>
      </nav>
    </header>
  );
}