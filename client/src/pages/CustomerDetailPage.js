import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import AddressList from "../components/AddressList";
import AddressForm from "../components/AddressForm";

function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [error, setError] = useState("");
  const [editingAddress, setEditingAddress] = useState(null);

  const fetchCustomer = async () => {
    setLoadingCustomer(true);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:5000/api/customers/${id}/with-address-count`
      );
      if (!res.ok) throw new Error("Failed to load customer");
      const data = await res.json();
      setCustomer(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingCustomer(false);
    }
  };

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:5000/api/customers/${id}/addresses`
      );
      if (!res.ok) throw new Error("Failed to load addresses");
      const data = await res.json();
      setAddresses(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
    fetchAddresses();
  }, [id]);

  const handleAddressAddedOrUpdated = () => {
    setEditingAddress(null);
    fetchAddresses();
    fetchCustomer();
  };

  const handleAddressDeleted = (deletedId) => {
    setAddresses((prev) => prev.filter((a) => a.id !== deletedId));
    fetchCustomer();
  };

  if (loadingCustomer) return <p>Loading customer...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!customer) return <p>Customer not found.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Customer Details</h1>
      <p className="mb-2">
        <strong>Name:</strong> {customer.first_name} {customer.last_name}{" "}
        {customer.only_one_address && (
          <span className="text-sm text-green-600 font-semibold">
            (Only One Address)
          </span>
        )}
      </p>
      <p className="mb-6">
        <strong>Phone:</strong> {customer.phone_number}
      </p>

      <h2 className="text-2xl font-semibold mb-3">Addresses</h2>
      {loadingAddresses ? (
        <p>Loading addresses...</p>
      ) : (
        <AddressList
          addresses={addresses}
          onAddressDeleted={handleAddressDeleted}
          onAddressEditRequested={setEditingAddress}
        />
      )}

      {editingAddress && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h3 className="text-xl font-semibold mb-2">Edit Address</h3>
          <AddressForm
            customerId={id}
            initialData={editingAddress}
            onSuccess={handleAddressAddedOrUpdated}
            onCancel={() => setEditingAddress(null)}
          />
        </div>
      )}

      {!editingAddress && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h3 className="text-xl font-semibold mb-2">Add New Address</h3>
          <AddressForm
            customerId={id}
            onSuccess={handleAddressAddedOrUpdated}
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
