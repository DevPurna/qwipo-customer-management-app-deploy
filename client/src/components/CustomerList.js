import React, { useEffect, useState } from "react";

function CustomerList({
  search,
  cityFilter,
  stateFilter,
  pinFilter,
  page,
  limit,
  onPageChange,
  onEdit,
  onDeleteSuccess,
}) {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchCustomers = async () => {
    const params = new URLSearchParams({
      search,
      city: cityFilter,
      state: stateFilter,
      pin_code: pinFilter,
      page,
      limit,
    });

    try {
      const res = await fetch(`http://localhost:5000/api/customers?${params}`);
      const data = await res.json();
      setCustomers(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, cityFilter, stateFilter, pinFilter, page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;
    try {
      await fetch(`http://localhost:5000/api/customers/${id}`, {
        method: "DELETE",
      });
      fetchCustomers();
      onDeleteSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <table className="w-full border">
        <thead>
          <tr>
            <th className="border p-2">Name</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td className="border p-2">
                {c.first_name} {c.last_name}
              </td>
              <td className="border p-2">{c.phone_number}</td>
              <td className="border p-2 space-x-2">
                <button
                  onClick={() => onEdit(c)}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-2 flex justify-center gap-2">
        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
          (p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-2 py-1 border ${
                page === p ? "bg-blue-500 text-white" : ""
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default CustomerList;
