import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import CustomerForm from "../components/CustomerForm";
import AddressList from "../components/AddressList";
import AddressForm from "../components/AddressForm";

function CustomerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customerData, setCustomerData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingAddress, setEditingAddress] = useState(null);
  const [addingNewAddress, setAddingNewAddress] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      setError("");
      Promise.all([
        
        fetch(
          `${process.env.REACT_APP_API_URL}/api/customers/${id}/with-address-count`
        ).then((res) => {
          if (!res.ok) throw new Error("Failed to load customer");
          return res.json();
        }),
        fetch(`${process.env.REACT_APP_API_URL}/api/customers/${id}/addresses`).then(
          (res) => {
            if (!res.ok) throw new Error("Failed to load addresses");
            return res.json();
          }
        ),
      ])
        .then(([customerRes, addressesRes]) => {
          setCustomerData(customerRes.data);
          setAddresses(addressesRes.data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [id]);

  const handleCustomerSubmit = async (customerData, addressData) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...customerData, ...addressData }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create customer");

      alert("Customer and address created successfully!");

      // Redirect to customer detail page
      navigate(`/customers/${data.data.id}`, { replace: true });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCustomerUpdateSuccess = () => {
    alert("Customer updated successfully");
  };

  const handleAddressAdded = (newAddress) => {
    if (!newAddress) return; // safety check
    setAddresses((prev) => [...prev, newAddress]);
    setAddingNewAddress(false);
  };

  const handleAddressUpdated = () => {
    fetch(`${process.env.REACT_APP_API_URL}/api/customers/${id}/addresses`)
      .then((res) => res.json())
      .then((data) => {
        setAddresses(data.data);
        alert("Address updated successfully!");
      })
      .catch(() => {});
    setEditingAddress(null);
  };

  const handleAddressDeleted = (deletedId) => {
    setAddresses((prev) => prev.filter((a) => a.id !== deletedId));
  };

  if (loading) return <p>Loading customer data...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">
        {id ? "Edit Customer" : "Add New Customer"}
      </h1>

      <div className="flex flex-col md:flex-row md:space-x-8">
        {/* Customer Form - only name, last name, phone */}
        <div className="md:w-1/2">
          <CustomerForm
            initialData={customerData}
            onSubmit={handleCustomerSubmit} // CALLS API
            onCancel={() => navigate("/")}
          />
        </div>

        {/* Address Management */}
        <div className="md:w-1/2 mt-8 md:mt-0">
          <h2 className="text-2xl font-semibold mb-4">Addresses</h2>

          <AddressList
            addresses={addresses}
            onAddressDeleted={handleAddressDeleted}
            onAddressEditRequested={setEditingAddress}
          />

          {editingAddress && (
            <div className="mt-6 p-4 border rounded bg-gray-50">
              <h3 className="text-xl font-semibold mb-2">Edit Address</h3>
              <AddressForm
                customerId={id}
                initialData={editingAddress}
                onSuccess={handleAddressUpdated}
                onCancel={() => setEditingAddress(null)}
              />
            </div>
          )}

          {!addingNewAddress && !editingAddress && (
            <button
              onClick={() => setAddingNewAddress(true)}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Add New Address
            </button>
          )}

          {addingNewAddress && (
            <div className="mt-6 p-4 border rounded bg-gray-50">
              <AddressForm
                customerId={id}
                onSuccess={handleAddressAdded}
                onCancel={() => setAddingNewAddress(false)}
              />
            </div>
          )}
        </div>
      </div>

      <p className="mt-6">
        <Link to="/" className="text-blue-600 hover:underline">
          &larr; Back to Customer List
        </Link>
      </p>
    </div>
  );
}

export default CustomerFormPage;
