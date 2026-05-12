import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "./supabaseClient";
import jsPDF from "jspdf";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  CalendarDays,
  Home,
  Users,
  Wallet,
  BarChart3,
  Settings,
  Search,
  Plus,
  Receipt,
  LogOut,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BedDouble,
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
} from "lucide-react";

function Card({ className = "", children }) {
  return <div className={`bg-white border border-[#D4AF37] ${className}`}>{children}</div>;
}

function CardContent({ className = "", children }) {
  return <div className={className}>{children}</div>;
}

function Button({ className = "", children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center px-4 py-2 rounded-xl bg-black text-white hover:bg-[#2b241f] transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const currency = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

const initialUnits = Array.from({ length: 16 }, (_, i) => {
  const types = ["Studio", "One Bedroom", "Two Bedroom", "Executive Suite"];
  const amenities = [
    "Wi‑Fi, AC, kitchenette",
    "Wi‑Fi, balcony, hot shower",
    "Wi‑Fi, kitchen, living room",
    "Wi‑Fi, AC, workspace, smart TV",
  ];
  const statusCycle = ["Vacant", "Occupied", "Booked"];
  return {
    id: i + 1,
    name: `Apartment ${String(i + 1).padStart(2, "0")}`,
    type: types[i % types.length],
    price: [85000, 120000, 180000, 250000][i % 4],
    amenities: amenities[i % amenities.length],
    status: statusCycle[i % 3],
    image: `https://images.unsplash.com/photo-${[
      "1522708323590-d24dbb6b0267",
      "1505693416388-ac5ce068fe85",
      "1560448204-e02f11c3d0e2",
      "1570129477492-45c003edd2be",
    ][i % 4]}?auto=format&fit=crop&w=800&q=80`,
  };
});

const initialBookings = [
  {
    id: "BK-1001",
    guest: "Sarah Akello",
    phone: "+256 770 123456",
    unit: "Apartment 02",
    checkIn: "09/05/2026",
    checkOut: "12/05/2026",
    nights: 3,
    total: 360000,
    paid: 200000,
    method: "MTN Mobile Money",
    status: "Checked in",
  },
  {
    id: "BK-1002",
    guest: "Michael Ouma",
    phone: "+256 752 889900",
    unit: "Apartment 07",
    checkIn: "10/05/2026",
    checkOut: "15/05/2026",
    nights: 5,
    total: 900000,
    paid: 900000,
    method: "Bank transfer",
    status: "Booked",
  },
  {
    id: "BK-1003",
    guest: "Amina Hassan",
    phone: "+256 701 456789",
    unit: "Apartment 11",
    checkIn: "08/05/2026",
    checkOut: "09/05/2026",
    nights: 1,
    total: 180000,
    paid: 120000,
    method: "Cash",
    status: "Checking out today",
  },
];

const paymentIcons = {
  Cash: Banknote,
  "MTN Mobile Money": Smartphone,
  "Airtel Money": Smartphone,
  "Bank transfer": Building2,
  Card: CreditCard,
};

function StatCard({ title, value, icon: Icon, note }) {
  return (
    <Card className="rounded-3xl shadow-sm min-h-[140px]">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-[#F3E5AB]">
          <Icon className="w-6 h-6 text-black" />
        </div>
        <div>
          <p className="text-sm text-[#D4AF37]">{title}</p>
          <p className="text-xl font-semibold text-black break-words">{value}</p>
          {note && <p className="text-xs text-[#D4AF37] mt-1">{note}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  const cls =
    status === "Vacant"
      ? "bg-[#F3E5AB] text-black border border-[#D4AF37]"
      : status === "Occupied" || status === "Checked in"
      ? "bg-black text-white"
      : status === "Checking out today"
      ? "bg-[#9c6644] text-white"
      : "bg-white text-black border border-[#9c6644]";
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}

export default function GuestHouseBookingSystem() {

  const [active, setActive] = useState("Dashboard");
  const [units, setUnits] = useState(initialUnits);
  const [bookings, setBookings] = useState([]);
  const [query, setQuery] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState({});
  const [paymentForm, setPaymentForm] = useState({
  amount: "",
  method: "Cash",
  notes: "",
  });
  const [form, setForm] = useState({
    guest: "",
    phone: "+256 ",
    unit: "Apartment 01",
    checkIn: "2026-05-09",
    checkOut: "2026-05-10",
    total: "",
    paid: "",
    method: "Cash",
  });
  const [session, setSession] = useState(null);

  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    async function loadData() {

      // Load apartments
      const { data: apartmentData, error: apartmentError } =
        await supabase
          .from("apartments")
          .select("*");

      if (apartmentError) {
        console.log(apartmentError);
      } else {
        const formattedApartments = apartmentData.map((apt) => ({
          id: apt.id,
          name: apt.name,
          type: apt.type,
          price: apt.price,
          amenities: apt.amenities,
          status: apt.status,
          image:
            apt.image_url ||
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        }));

        setUnits(formattedApartments);
      }

      // Load bookings with guest + apartment info
      const { data: bookingData, error: bookingError } =
        await supabase
          .from("bookings")
          .select(`
            *,
            guests (
              full_name,
              phone
            ),
            apartments (
              name
            )
          `);

      if (bookingError) {
        console.log(bookingError);
      } else {
        const formattedBookings = bookingData.map((booking) => ({
          id: `BK-${booking.id}`,
          guest: booking.guests?.full_name || "Unknown Guest",
          phone: booking.guests?.phone || "",
          unit: booking.apartments?.name || "",
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          total: booking.total_amount,
          paid: booking.paid_amount,
          method: "Saved Payment",
          status: booking.status,
        }));

        setBookings(formattedBookings);
      }
    }

    loadData();
  }, []);

useEffect(() => {
  async function loadUserRole(session) {
    if (!session?.user?.id) {
      setUserRole(null);
      return;
    }

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (!error && data) {
      setUserRole(data.role);
    }
  }

  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    loadUserRole(session);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
    loadUserRole(session);
  });

  return () => subscription.unsubscribe();
}, []);

  const signUp = async () => {

  const { error } = await supabase.auth.signUp({
    email: authForm.email,
    password: authForm.password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Account created successfully!");
  };

  const signIn = async () => {

  const { error } = await supabase.auth.signInWithPassword({
    email: authForm.email,
    password: authForm.password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Logged in successfully!");
  };

  const signOut = async () => {
  await supabase.auth.signOut();
  };

  const occupied = units.filter((u) => u.status === "Occupied").length;
  const booked = units.filter((u) => u.status === "Booked").length;
  const vacant = units.filter((u) => u.status === "Vacant").length;
  const revenue = bookings.reduce((s, b) => s + b.paid, 0);
  const outstanding = bookings.reduce((s, b) => s + Math.max(0, b.total - b.paid), 0);

  const totalBookings = bookings.length;

const fullyPaidBookings = bookings.filter(
  (b) => Number(b.paid) >= Number(b.total)
).length;

const partiallyPaidBookings = bookings.filter(
  (b) => Number(b.paid) > 0 && Number(b.paid) < Number(b.total)
).length;

const unpaidBookings = bookings.filter(
  (b) => Number(b.paid) === 0
).length;

  const occupancyRate = Math.round(((occupied + booked) / units.length) * 100);

const paymentChartData = [
  { name: "Received", value: revenue },
  { name: "Outstanding", value: outstanding },
];

const statusChartData = [
  { name: "Vacant", value: vacant },
  { name: "Occupied", value: occupied },
  { name: "Booked", value: booked },
];

const monthlyRevenueData = [
  { month: "Jan", revenue: 0 },
  { month: "Feb", revenue: 0 },
  { month: "Mar", revenue: 0 },
  { month: "Apr", revenue: 0 },
  { month: "May", revenue: revenue * 0.4 },
  { month: "Jun", revenue: revenue * 0.6 },
  { month: "Jul", revenue: revenue * 0.8 },
  { month: "Aug", revenue: revenue * 1.1 },
  { month: "Sep", revenue: revenue * 0.9 },
  { month: "Oct", revenue: revenue * 1.2 },
  { month: "Nov", revenue: revenue * 1.3 },
  { month: "Dec", revenue: revenue * 1.5 },
];

  const filteredBookings = useMemo(() => {
    const q = query.toLowerCase();
    return bookings.filter(
      (b) =>
        b.guest.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q) ||
        b.unit.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q)
    );
  }, [bookings, query]);

  const calendarEvents = bookings.map((b) => ({
  title: `${b.guest} - ${b.unit}`,
  start: b.checkIn,
  end: b.checkOut,
  color:
    b.status === "Checked in"
      ? "#D4AF37"
      : b.status === "Booked"
      ? "#3b82f6"
      : "#ef4444",
}));

  const addBooking = async () => {
  if (!form.guest || !form.phone || !form.total) return;

  // 1. Create guest
  const { data: guestData, error: guestError } = await supabase
    .from("guests")
    .insert([
      {
        full_name: form.guest,
        phone: form.phone,
      },
    ])
    .select()
    .single();

  if (guestError) {
    console.log("Guest error:", guestError);
    return;
  }

  // 2. Find selected apartment
  const selectedUnit = units.find((u) => u.name === form.unit);

  // 3. Create booking
  const { data: bookingData, error: bookingError } = await supabase
    .from("bookings")
    .insert([
      {
        guest_id: guestData.id,
        apartment_id: selectedUnit.id,
        check_in: form.checkIn,
        check_out: form.checkOut,
        total_amount: Number(form.total),
        paid_amount: Number(form.paid || 0),
        status: "Booked",
      },
    ])
    .select()
    .single();

  if (bookingError) {
    console.log("Booking error:", bookingError);
    return;
  }

  // 4. Save payment if paid amount exists
  if (Number(form.paid || 0) > 0) {
    const { error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          booking_id: bookingData.id,
          amount: Number(form.paid),
          method: form.method,
          notes: "Initial booking payment",
        },
      ]);

    if (paymentError) {
      console.log("Payment error:", paymentError);
    }
  }

  // 5. Update apartment status
  await supabase
    .from("apartments")
    .update({ status: "Booked" })
    .eq("id", selectedUnit.id);

  // 6. Update screen immediately
  const newBooking = {
    id: `BK-${bookingData.id}`,
    guest: form.guest,
    phone: form.phone,
    unit: form.unit,
    checkIn: form.checkIn,
    checkOut: form.checkOut,
    nights: 1,
    total: Number(form.total),
    paid: Number(form.paid || 0),
    method: form.method,
    status: "Booked",
  };

  setBookings([newBooking, ...bookings]);
  setUnits((prev) =>
    prev.map((u) =>
      u.id === selectedUnit.id ? { ...u, status: "Booked" } : u
    )
  );

  setForm({
    ...form,
    guest: "",
    phone: "+256 ",
    total: "",
    paid: "",
  });

  alert("Booking saved to database successfully!");
  };
    const generateInvoice = (booking) => {
  try {
    const doc = new jsPDF("p", "mm", "a4");

    doc.setFontSize(22);
    doc.text("Helen's APARTMENT", 20, 20);

    doc.setFontSize(12);
    doc.text("Kampala, Uganda", 20, 30);
    doc.text("Booking Receipt / Invoice", 20, 45);

    doc.line(20, 50, 190, 50);

    doc.text(`Receipt No: ${booking.id}`, 20, 65);
    doc.text(`Guest: ${booking.guest}`, 20, 75);
    doc.text(`Phone: ${booking.phone}`, 20, 85);
    doc.text(`Apartment: ${booking.unit}`, 20, 95);
    doc.text(`Check-in: ${booking.checkIn}`, 20, 105);
    doc.text(`Check-out: ${booking.checkOut}`, 20, 115);
    doc.text(`Payment Method: ${booking.method || "N/A"}`, 20, 125);

    doc.line(20, 135, 190, 135);

    doc.text(`Total: UGX ${Number(booking.total || 0).toLocaleString()}`, 20, 150);
    doc.text(`Paid: UGX ${Number(booking.paid || 0).toLocaleString()}`, 20, 160);
    doc.text(
      `Balance: UGX ${Math.max(
        0,
        Number(booking.total || 0) - Number(booking.paid || 0)
      ).toLocaleString()}`,
      20,
      170
    );

    doc.text("Thank you for choosing Helen's APARTMENT.", 20, 195);

    doc.save(`${booking.id || "booking"}-invoice.pdf`);
  } catch (error) {
    alert("Invoice error: " + error.message);
    console.error(error);
  }
  };

  const recordPayment = async (booking) => {

  const bookingId = String(booking.id).replace("BK-", "");

  const paymentAmount = Number(paymentForm.amount || 0);

  if (!paymentAmount) {
    alert("Enter payment amount");
    return;
  }

  // Save payment
  const { error: paymentError } = await supabase
    .from("payments")
    .insert([
      {
        booking_id: bookingId,
        amount: paymentAmount,
        method: paymentForm.method,
        notes: paymentForm.notes,
      },
    ]);

  if (paymentError) {
    alert(paymentError.message);
    return;
  }

  // Update booking paid amount
  const newPaidAmount = Number(booking.paid || 0) + paymentAmount;

  const { error: bookingError } = await supabase
    .from("bookings")
    .update({
      paid_amount: newPaidAmount,
    })
    .eq("id", bookingId);

  if (bookingError) {
    alert(bookingError.message);
    return;
  }

  // Update frontend
  setBookings((prev) =>
    prev.map((b) =>
      b.id === booking.id
        ? {
            ...b,
            paid: newPaidAmount,
          }
        : b
    )
  );

  setPaymentForm({
    amount: "",
    method: "Cash",
    notes: "",
  });

  alert("Payment recorded successfully!");
  };

  const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);

  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? "";
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
};

  const loadPaymentHistory = async (booking) => {
  const bookingId = String(booking.id).replace("BK-", "");

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("booking_id", bookingId)
    .order("payment_date", { ascending: false });

  if (error) {
    alert(error.message);
    return;
  }

  setPaymentHistory((prev) => ({
    ...prev,
    [booking.id]: data,
  }));
};

  const updateBookingStatus = async (booking, newStatus) => {
  const bookingId = String(booking.id).replace("BK-", "");

  const apartment = units.find((u) => u.name === booking.unit);

  const { error } = await supabase
    .from("bookings")
    .update({ status: newStatus })
    .eq("id", bookingId);

  if (error) {
    alert(error.message);
    return;
  }

  let apartmentStatus = "Booked";

  if (newStatus === "Checked in") {
    apartmentStatus = "Occupied";
  }

  if (newStatus === "Checked out") {
    apartmentStatus = "Vacant";
  }

  if (apartment) {
    await supabase
      .from("apartments")
      .update({ status: apartmentStatus })
      .eq("id", apartment.id);
  }

  setBookings((prev) =>
    prev.map((b) =>
      b.id === booking.id ? { ...b, status: newStatus } : b
    )
  );

  setUnits((prev) =>
    prev.map((u) =>
      u.name === booking.unit ? { ...u, status: apartmentStatus } : u
    )
  );

  alert(`Booking updated to ${newStatus}`);
};
  const canAccess = (page) => {
  if (userRole === "Admin") return true;

  if (userRole === "Receptionist") {
    return ["Dashboard", "Apartments", "Bookings", "Calendar"].includes(page);
  }

  if (userRole === "Accountant") {
    return ["Dashboard", "Payments", "Guests"].includes(page);
  }

  if (userRole === "Housekeeping") {
    return ["Dashboard", "Apartments", "Calendar"].includes(page);
  }

  return false;
  };

  const nav = [
    ["Dashboard", BarChart3],
    ["Apartments", Home],
    ["Bookings", CalendarDays],
    ["Payments", Wallet],
    ["Guests", Users],
    ["Admin", Settings],
    ["Calendar", CalendarDays],
  ];

  if (!session) {
  return (
    <div className="min-h-screen bg-[#f6efe5] flex items-center justify-center p-6">

      <div className="bg-white border border-[#D4AF37] rounded-3xl shadow-xl p-8 w-full max-w-md">

        <h1 className="text-4xl font-bold text-black mb-2">
          <div className="flex flex-col items-center mb-4">
  <img
    src="/helens-logo.jpeg"
    alt="Helen's Apartment Logo"
    className="w-44 h-44 object-contain rounded-3xl shadow-xl border border-[#D4AF37] bg-black p-2 mb-4"
  />

  <h1 className="text-4xl font-bold text-black text-center">
    Helen's APARTMENT
  </h1>
  </div>
        </h1>

        <p className="text-[#D4AF37] mb-8">
          Kampala, Uganda
        </p>

        <div className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            value={authForm.email}
            onChange={(e) =>
              setAuthForm({
                ...authForm,
                email: e.target.value,
              })
            }
            className="w-full border border-[#D4AF37] rounded-xl px-4 py-3"
          />

          <input
            type="password"
            placeholder="Password"
            value={authForm.password}
            onChange={(e) =>
              setAuthForm({
                ...authForm,
                password: e.target.value,
              })
            }
            className="w-full border border-[#D4AF37] rounded-xl px-4 py-3"
          />

          <Button
            onClick={signIn}
            className="w-full"
          >
            Login
          </Button>

          <Button
            onClick={signUp}
            className="w-full bg-[#D4AF37] text-black hover:bg-[#c4ac90]"
          >
            Create Account
          </Button>

        </div>

      </div>

    </div>
  );
  }

  return (
    <div className="min-h-screen bg-[#f6efe5] text-black">
      <div className="flex">
        <aside className="hidden lg:flex w-72 min-h-screen bg-black text-white p-5 flex-col border-r border-[#D4AF37]">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-[#D4AF37] text-black">
              <BedDouble className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-col items-center text-center gap-4">
  <img
    src="/helens-logo.jpeg"
    alt="Helen's Apartment Logo"
    className="w-40 h-40 object-contain rounded-3xl shadow-2xl border border-[#D4AF37] bg-black p-2"
  />

  <h1 className="text-2xl font-bold tracking-wide">
    Helen's APARTMENT
  </h1>

  <p className="text-sm text-[#D4AF37]">
    Luxury Apartment Booking & Management System
  </p>
  </div>
              <p className="text-sm text-[#D4AF37]">Kampala booking system</p>
            </div>
          </div>
          <nav className="space-y-2 flex-1">
            {nav.filter(([label]) => canAccess(label)).map(([label, Icon]) => (
              <button
                key={label}
                onClick={() => setActive(label)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition ${
                  active === label ? "bg-[#D4AF37] text-black" : "hover:bg-white/10 text-[#f6efe5]"
                }`}
              >
                <Icon className="w-5 h-5" /> {label}
              </button>
            ))}
          </nav>
          <Button
            onClick={signOut}
            className="rounded-2xl bg-[#D4AF37] hover:bg-[#c4ac90] text-black"
          >
          <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </aside>

        <main className="flex-1 p-4 md:p-8">
    <div className="lg:hidden mb-6">
    <div className="bg-black border border-[#D4AF37] rounded-2xl p-3">
      <select
        value={active}
        onChange={(e) => setActive(e.target.value)}
        className="w-full bg-black text-[#D4AF37] border border-[#D4AF37] rounded-xl px-3 py-3"
       >
        {nav
          .filter(([label]) => canAccess(label))
          .map(([label]) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
      </select>
    </div>
</div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <p className="text-sm text-[#D4AF37]">Today: 9 May 2026 · Kampala, Uganda</p>
              <h2 className="text-3xl font-bold text-black">{active}</h2>
              <p className="text-sm text-[#D4AF37]">
                Logged in as: {userRole || "Loading role..."}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white border border-[#D4AF37] rounded-2xl px-4 py-3 shadow-sm max-w-md w-full">
              <Search className="w-5 h-5 text-[#D4AF37]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search guest, booking, phone, unit..."
                className="outline-none w-full bg-transparent text-sm text-black placeholder:text-[#9a8a76]"
              />
            </div>
          </div>

          {active === "Dashboard" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard title="Daily occupancy" value={`${occupied + booked}/16`} icon={Home} note={`${vacant} vacant units`} />
                <StatCard title="Monthly revenue" value={currency.format(revenue)} icon={Wallet} note="Payments received" />
                <StatCard title="Outstanding payment" value={currency.format(outstanding)} icon={AlertTriangle} note="Unpaid balances" />
                <StatCard title="Check-outs today" value="1" icon={Clock} note="Needs room inspection" />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => exportToCSV(bookings, "bookings-report.csv")}
                  className="bg-[#D4AF37] text-black hover:bg-[#B8860B]"
                  >
                  Export Bookings CSV
                </Button>

                <Button
                  onClick={() => exportToCSV(units, "apartments-report.csv")}
                  className="bg-[#D4AF37] text-black hover:bg-[#B8860B]"
                  >
                  Export Apartments CSV
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Total bookings"
                    value={totalBookings}
                    icon={CalendarDays}
                    note="All saved bookings"
                  />

                  <StatCard
                    title="Fully paid"
                    value={fullyPaidBookings}
                    icon={CheckCircle2}
                    note="No balance remaining"
                  />

                  <StatCard
                    title="Partially paid"
                    value={partiallyPaidBookings}
                    icon={Wallet}
                    note="Some balance remaining"
                  />

                  <StatCard
                    title="Unpaid"
                    value={unpaidBookings}
                    icon={AlertTriangle}
                    note="No payment recorded"
                  />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                
                <Card className="rounded-3xl shadow-sm min-h-[420px]">
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold mb-4">
                      Monthly Revenue
                    </h3>

                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyRevenueData}>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="revenue" fill="#D4AF37" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-sm min-h-[420px]">
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold mb-4">
                      Room Status
                    </h3>

                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusChartData}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={90}
                            label
                          >
                            <Cell fill="#D4AF37" />
                            <Cell fill="#050505" />
                            <Cell fill="#B8860B" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <p className="text-center font-semibold mt-3">
                      Occupancy Rate: {occupancyRate}%
                    </p>
                  </CardContent>
                </Card>
              
                <Card className="xl:col-span-2 rounded-3xl shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold mb-4">Checking / Check-out daily report</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-left text-[#D4AF37] border-b border-[#D4AF37]">
                          <tr><th className="py-3">Guest</th><th>Unit</th><th>Dates</th><th>Status</th><th>Balance</th></tr>
                        </thead>
                        <tbody>
                          {filteredBookings.map((b) => (
                            <tr key={b.id} className="border-b border-[#efe4d4] last:border-0">
                              <td className="py-3 font-medium">{b.guest}<br/><span className="text-xs text-[#D4AF37]">{b.phone}</span></td>
                              <td>{b.unit}</td>
                              <td>{b.checkIn} → {b.checkOut}</td>
                              <td><StatusBadge status={b.status} /></td>
                              <td>{currency.format(Math.max(0, b.total - b.paid))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold mb-4">Occupancy summary</h3>
                    <div className="space-y-4">
                      {[["Vacant", vacant], ["Occupied", occupied], ["Booked", booked]].map(([label, count]) => (
                        <div key={label}>
                          <div className="flex justify-between text-sm mb-1"><span>{label}</span><span>{count}/16</span></div>
                          <div className="h-3 bg-[#F3E5AB] rounded-full overflow-hidden"><div className="h-full bg-black rounded-full" style={{ width: `${(count / 16) * 100}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
            
          )}

          {active === "Apartments" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {units.map((u) => (
                <Card key={u.id} className="rounded-3xl overflow-hidden shadow-sm">
                  <img src={u.image} alt={u.name} className="h-40 w-full object-cover" />
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div><h3 className="font-semibold">{u.name}</h3><p className="text-sm text-[#D4AF37]">{u.type}</p></div>
                      <StatusBadge status={u.status} />
                    </div>
                    <p className="text-sm text-[#D4AF37]">{u.amenities}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-[#D4AF37]">
                      <span className="font-semibold">{currency.format(u.price)}/night</span>
                      <Button className="rounded-xl px-3 py-1 text-sm">View calendar</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}

          {active === "Bookings" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <Card className="rounded-3xl shadow-sm">
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> Manual booking entry</h3>
                  <div className="space-y-3">
                    <input className="w-full border border-[#D4AF37] rounded-xl px-3 py-2 bg-white" placeholder="Guest full name" value={form.guest} onChange={(e) => setForm({ ...form, guest: e.target.value })} />
                    <input className="w-full border border-[#D4AF37] rounded-xl px-3 py-2 bg-white" placeholder="Phone / contact" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    <select className="w-full border border-[#D4AF37] rounded-xl px-3 py-2 bg-white" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>{units.map((u) => <option key={u.id}>{u.name}</option>)}</select>
                    <div className="grid grid-cols-2 gap-3"><input type="date" className="border border-[#D4AF37] rounded-xl px-3 py-2 bg-white" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} /><input type="date" className="border border-[#D4AF37] rounded-xl px-3 py-2 bg-white" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3"><input className="border border-[#D4AF37] rounded-xl px-3 py-2 bg-white" placeholder="Total UGX" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} /><input className="border border-[#D4AF37] rounded-xl px-3 py-2 bg-white" placeholder="Paid UGX" value={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.value })} /></div>
                    <select className="w-full border border-[#D4AF37] rounded-xl px-3 py-2 bg-white" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}><option>Cash</option><option>MTN Mobile Money</option><option>Airtel Money</option><option>Bank transfer</option><option>Card</option></select>
                    <Button onClick={addBooking} className="w-full rounded-xl">Save booking</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="xl:col-span-2 rounded-3xl shadow-sm">
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold mb-4">Booking history</h3>
                  <div className="space-y-3">
                    {filteredBookings.map((b) => (
                      <div key={b.id} className="p-4 rounded-2xl border border-[#D4AF37] bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div><p className="font-semibold">{b.id} · {b.guest}</p><p className="text-sm text-[#D4AF37]">{b.unit} · {b.checkIn} to {b.checkOut} · {b.phone}</p></div>
                        <div className="flex items-center gap-3"><StatusBadge status={b.status} />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => updateBookingStatus(b, "Checked in")}
                            className="rounded-xl"
                          >
                            Check in
                          </Button>

                          <Button
                            onClick={() => updateBookingStatus(b, "Checked out")}
                            className="rounded-xl bg-[#D4AF37] text-black hover:bg-[#B8860B]"
                          >
                            Check out
                          </Button>
                        </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {active === "Payments" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><StatCard title="Received" value={currency.format(revenue)} icon={CheckCircle2} /><StatCard title="Outstanding" value={currency.format(outstanding)} icon={AlertTriangle} /><StatCard title="Receipts issued" value={bookings.length} icon={Receipt} /></div>
              <Card className="rounded-3xl shadow-sm"><CardContent className="p-5"><h3 className="text-lg font-semibold mb-4">Payment history per guest</h3><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{filteredBookings.map((b) => { const Icon = paymentIcons[b.method] || Wallet; return <div key={b.id} className="border border-[#D4AF37] rounded-2xl p-4 bg-white"><div className="flex justify-between"><div><p className="font-semibold">{b.guest}</p><p className="text-sm text-[#D4AF37]">{b.id} · {b.unit}</p></div><Icon className="w-5 h-5" /></div><div className="mt-4 text-sm space-y-1"><p>Total: <b>{currency.format(b.total)}</b></p><p>Paid: <b>{currency.format(b.paid)}</b></p><p>Balance: <b>{currency.format(Math.max(0, b.total - b.paid))}</b></p><p>Method: {b.method}</p></div>
                <div className="mt-4 space-y-2">

                  <input
                    type="number"
                    placeholder="Payment amount"
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        amount: e.target.value,
                      })
                    }
                    className="w-full border border-[#D4AF37] rounded-xl px-3 py-2"
                  />

                  <select
                    value={paymentForm.method}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        method: e.target.value,
                      })
                    }
                    className="w-full border border-[#D4AF37] rounded-xl px-3 py-2"
                  >
                    <option>Cash</option>
                    <option>MTN Mobile Money</option>
                    <option>Airtel Money</option>
                    <option>Bank transfer</option>
                    <option>Card</option>
                  </select>

                  <input
                    placeholder="Notes"
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        notes: e.target.value,
                      })
                    }
                    className="w-full border border-[#D4AF37] rounded-xl px-3 py-2"
                  />

                  <Button
                    onClick={() => recordPayment(b)}
                    className="w-full rounded-xl"
                  >
                    Record Payment
                  </Button>

                  <Button
                    onClick={() => loadPaymentHistory(b)}
                    className="w-full rounded-xl bg-[#D4AF37] text-black hover:bg-[#B8860B]"
                  >
                    View Payment History
                  </Button>

                </div>
                  

                  {paymentHistory[b.id] && (
                    <div className="mt-4 border-t border-[#D4AF37] pt-3 space-y-2">
                      <p className="font-semibold text-sm">Payment History</p>

                      {paymentHistory[b.id].map((payment) => (
                        <div
                          key={payment.id}
                          className="text-sm bg-[#F3E5AB] rounded-xl p-3"
                        >
                          <p>Amount: UGX {Number(payment.amount).toLocaleString()}</p>
                          <p>Method: {payment.method}</p>
                          <p>
                            Date:{" "}
                            {new Date(payment.payment_date).toLocaleString()}
                          </p>
                          {payment.notes && <p>Notes: {payment.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                
              <Button
                 onClick={() => generateInvoice(b)}
                  className="w-full mt-4 rounded-xl"
              >
              <Receipt className="w-4 h-4 mr-2" /> Generate invoice
              </Button>
              </div>})}</div></CardContent></Card>
            </motion.div>
          )}
          {active === "Calendar" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="rounded-3xl shadow-sm bg-[#111111] border border-[#D4AF37]">
                <CardContent className="p-5">

                  <h3 className="text-2xl font-semibold mb-6 text-[#D4AF37]">
                    Booking Calendar
                  </h3>

                  <div className="bg-white rounded-2xl p-4">
                    <FullCalendar
                      plugins={[dayGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      height="auto"
                      events={calendarEvents}
                    />
                  </div>

                </CardContent>
              </Card>
            </motion.div>
          )}

          {active === "Guests" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredBookings.map((b) => (
                <Card key={b.id} className="rounded-3xl shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold">{b.guest.charAt(0)}</div><div><h3 className="font-semibold">{b.guest}</h3><p className="text-sm text-[#D4AF37]">{b.phone}</p></div></div><div className="mt-4 text-sm text-[#D4AF37] space-y-1"><p>Last booking: {b.id}</p><p>Unit: {b.unit}</p><p>Total paid: {currency.format(b.paid)}</p></div></CardContent></Card>
              ))}
            </motion.div>
          )}

          {active === "Admin" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="rounded-3xl shadow-sm"><CardContent className="p-5"><h3 className="text-lg font-semibold mb-4">Management access</h3><div className="space-y-3"><div className="p-4 border border-[#D4AF37] rounded-2xl flex justify-between"><span>Owner / Manager</span><StatusBadge status="Occupied" /></div><div className="p-4 border border-[#D4AF37] rounded-2xl flex justify-between"><span>Can view reports, edit prices, approve payments</span><CheckCircle2 /></div></div></CardContent></Card>
              <Card className="rounded-3xl shadow-sm"><CardContent className="p-5"><h3 className="text-lg font-semibold mb-4">Staff access</h3><div className="space-y-3"><div className="p-4 border border-[#D4AF37] rounded-2xl flex justify-between"><span>Reception staff</span><span className="text-sm text-[#D4AF37]">Bookings + check in/out</span></div><div className="p-4 border border-[#D4AF37] rounded-2xl flex justify-between"><span>Accounts staff</span><span className="text-sm text-[#D4AF37]">Payments + invoices</span></div><div className="p-4 border border-[#D4AF37] rounded-2xl flex justify-between"><span>Housekeeping</span><span className="text-sm text-[#D4AF37]">Availability + daily checkout</span></div></div></CardContent></Card>
            </motion.div>
          )}
        </main>
      </div>
    </div>
    
  );
  
  
}
