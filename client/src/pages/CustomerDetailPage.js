import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import CustomerForm from "../components/CustomerForm"; // updated to include address fields
import AddressList from "../components/AddressList";
import AddressForm from "../components/AddressForm";

function CustomerDetailPage() {
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // For editing an address from the list (not primary)
  const [editingAddress, setEditingAddress] = useState(null);
  // For adding a new address
  const [addingAddress, setAddingAddress] = useState(false);

  // Fetch customer and addresses
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const customerRes = await fetch(
        `http://localhost:5000/api/customers/${id}`
      );
      if (!customerRes.ok) throw new Error("Failed to load customer");
      const customerData = await customerRes.json();

      const addressesRes = await fetch(
        `http://localhost:5000/api/customers/${id}/addresses`
      );
      if (!addressesRes.ok) throw new Error("Failed to load addresses");
      const addressesData = await addressesRes.json();

      setCustomer(customerData.data);
      setAddresses(addressesData.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Primary address is the first address or null
  const primaryAddress = addresses.length > 0 ? addresses[0] : null;

  // Handle customer + primary address update
  const handleCustomerFormSubmit = async (customerData, addressData) => {
    setError("");
    try {
      // Update customer info
      const resCustomer = await fetch(
        `http://localhost:5000/api/customers/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customerData),
        }
      );
      if (!resCustomer.ok) {
        const errData = await resCustomer.json();
        throw new Error(errData.error || "Failed to update customer");
      }

      if (primaryAddress) {
        // Update primary address
        const resAddress = await fetch(
          `http://localhost:5000/api/addresses/${primaryAddress.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(addressData),
          }
        );
        if (!resAddress.ok) {
          const errData = await resAddress.json();
          throw new Error(errData.error || "Failed to update address");
        }
      } else {
        // No primary address yet, create one
        const resAddress = await fetch(
          `http://localhost:5000/api/customers/${id}/addresses`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(addressData),
          }
        );
        if (!resAddress.ok) {
          const errData = await resAddress.json();
          throw new Error(errData.error || "Failed to add address");
        }
      }

      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle delete address from list
  const handleAddressDeleted = async (addressId) => {
    setError("");
    try {
      const res = await fetch(
        `http://localhost:5000/api/addresses/${addressId}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete address");
      }
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle add/edit address form submit (for addresses other than primary)
  const handleAddressFormSubmit = async (addressData, addressId = null) => {
    setError("");
    try {
      if (addressId) {
        // Update existing address
        const res = await fetch(
          `http://localhost:5000/api/addresses/${addressId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(addressData),
          }
        );
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update address");
        }
      } else {
        // Add new address
        const res = await fetch(
          `http://localhost:5000/api/customers/${id}/addresses`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(addressData),
          }
        );
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to add address");
        }
      }
      setEditingAddress(null);
      setAddingAddress(false);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!customer) return <p>Customer not found.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Customer Details</h1>

      {/* Customer form with primary address */}
      <CustomerForm
        initialData={customer}
        initialAddress={primaryAddress}
        onSubmit={handleCustomerFormSubmit}
      />

      <h2 className="text-2xl font-semibold mt-8 mb-3">Addresses</h2>

      {/* Address list */}
      <AddressList
        addresses={addresses}
        onAddressDeleted={handleAddressDeleted}
        onAddressEditRequested={setEditingAddress}
        primaryAddressId={primaryAddress ? primaryAddress.id : null}
      />

      {/* Add new address button */}
      {!addingAddress && (
        <button
          onClick={() => setAddingAddress(true)}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Add New Address
        </button>
      )}

      {/* Add/Edit address form */}
      {(addingAddress || editingAddress) && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h3 className="text-xl font-semibold mb-2">
            {editingAddress ? "Edit Address" : "Add New Address"}
          </h3>
          <AddressForm
            initialData={editingAddress}
            customerId={id}
            onSuccess={handleAddressFormSubmit}
            onCancel={() => {
              setEditingAddress(null);
              setAddingAddress(false);
            }}
          />
        </div>
      )}

      <p className="mt-6">
        <Link to="/" className="text-blue-600 hover:underline">
          &larr; Back to Customer List
        </Link>
      </p>
    </div>
  );
}

export default CustomerDetailPage;
