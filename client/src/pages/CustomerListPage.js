import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import CustomerList from "../components/CustomerList";

function CustomerListPage() {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [pinFilter, setPinFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 5;

  const navigate = useNavigate();

  // Forcing CustomerList to reload on filters/page changes by passing props
  const handleEdit = (customer) => {
    navigate(`/customers/${customer.id}/edit`);
  };

  const handleDeleteSuccess = () => {
    // No special action needed here, CustomerList will reload data internally
  };

  const handleClearFilters = () => {
    setSearch("");
    setCityFilter("");
    setStateFilter("");
    setPinFilter("");
    setPage(1);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Customer List</h1>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search by name or phone"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="w-full p-2 border border-gray-300 rounded mb-4"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Filter by City"
          value={cityFilter}
          onChange={(e) => {
            setCityFilter(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[150px] p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Filter by State"
          value={stateFilter}
          onChange={(e) => {
            setStateFilter(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[150px] p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Filter by Pin Code"
          value={pinFilter}
          onChange={(e) => {
            setPinFilter(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[150px] p-2 border rounded"
        />
        <button
          onClick={handleClearFilters}
          className="px-4 py-2 bg-gray-400 rounded hover:bg-gray-500"
        >
          Clear Filters
        </button>
      </div>

      {/* Add New Customer Button */}
      <div className="mb-4 text-right">
        <Link
          to="/customers/new"
          className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + Add New Customer
        </Link>
      </div>

      {/* Customer List */}
      <CustomerList
        search={search}
        cityFilter={cityFilter}
        stateFilter={stateFilter}
        pinFilter={pinFilter}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onEdit={handleEdit}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
}

export default CustomerListPage;
