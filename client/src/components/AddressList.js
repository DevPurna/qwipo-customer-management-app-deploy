import React, { useState } from "react";

function AddressList({
  addresses,
  onAddressDeleted,
  onAddressEditRequested,
  primaryAddressId,
}) {
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState("");

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;

    setLoadingId(id);
    setError("");

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/addresses/${id}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete address.");
      }
      onAddressDeleted(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  if (addresses.length === 0)
    return <p className="text-gray-500">No addresses found.</p>;

  return (
    <>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <ul className="space-y-3">
        {addresses.map((addr) => {
          const isPrimary = addr.id === primaryAddressId;
          return (
            <li
              key={addr.id}
              className={`flex justify-between items-center p-3 border rounded shadow-sm hover:shadow-md ${
                isPrimary ? "bg-yellow-100" : ""
              }`}
            >
              <div>
                {addr.address_details}, {addr.city}, {addr.state} -{" "}
                {addr.pin_code}{" "}
                {isPrimary && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-yellow-800 bg-yellow-300 rounded">
                    Primary
                  </span>
                )}
              </div>
              <div className="space-x-2">
                {!isPrimary && (
                  <>
                    <button
                      onClick={() => onAddressEditRequested(addr)}
                      disabled={loadingId === addr.id}
                      className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      disabled={loadingId === addr.id}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      {loadingId === addr.id ? "Deleting..." : "Delete"}
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default AddressList;
