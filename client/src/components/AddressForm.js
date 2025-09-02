import React, { useState, useEffect } from "react";

function AddressForm({ customerId, onSuccess, initialData = null, onCancel }) {
  const [addressDetails, setAddressDetails] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setAddressDetails(initialData.address_details);
      setCity(initialData.city);
      setState(initialData.state);
      setPinCode(initialData.pin_code);
    } else {
      setAddressDetails("");
      setCity("");
      setState("");
      setPinCode("");
    }
    setError("");
  }, [initialData]);

  const validate = () => {
    if (
      !addressDetails.trim() ||
      !city.trim() ||
      !state.trim() ||
      !pinCode.trim()
    ) {
      setError("All fields are required.");
      return false;
    }
    if (!/^\d{5,6}$/.test(pinCode.trim())) {
      setError("Pin Code must be 5 or 6 digits.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");

    try {
      const url = initialData
        ? `http://localhost:5000/api/addresses/${initialData.id}`
        : `http://localhost:5000/api/customers/${customerId}/addresses`;

      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address_details: addressDetails.trim(),
          city: city.trim(),
          state: state.trim(),
          pin_code: pinCode.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit address.");
      }

      onSuccess && onSuccess();
      if (!initialData) {
        // Clear form after adding new address
        setAddressDetails("");
        setCity("");
        setState("");
        setPinCode("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white p-6 rounded shadow space-y-4"
    >
      <h2 className="text-xl font-semibold">
        {initialData ? "Edit Address" : "Add New Address"}
      </h2>

      {error && <p className="text-red-600">{error}</p>}

      <div>
        <label className="block mb-1 font-medium">Address Details</label>
        <input
          type="text"
          value={addressDetails}
          onChange={(e) => setAddressDetails(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={loading}
          placeholder="Street, building, etc."
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">City</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={loading}
          placeholder="City"
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">State</label>
        <input
          type="text"
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={loading}
          placeholder="State"
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Pin Code</label>
        <input
          type="text"
          value={pinCode}
          onChange={(e) => setPinCode(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={loading}
          placeholder="Postal/ZIP code"
        />
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? initialData
              ? "Updating..."
              : "Adding..."
            : initialData
            ? "Update Address"
            : "Add Address"}
        </button>
        {initialData && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default AddressForm;
