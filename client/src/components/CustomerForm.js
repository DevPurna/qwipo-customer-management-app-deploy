import React, { useState, useEffect } from "react";

function CustomerForm({ initialData, initialAddress, onSubmit }) {
  const [firstName, setFirstName] = useState(initialData?.first_name || "");
  const [lastName, setLastName] = useState(initialData?.last_name || "");
  const [phoneNumber, setPhoneNumber] = useState(
    initialData?.phone_number || ""
  );

  const [addressDetails, setAddressDetails] = useState(
    initialAddress?.address_details || ""
  );
  const [city, setCity] = useState(initialAddress?.city || "");
  const [state, setState] = useState(initialAddress?.state || "");
  const [pinCode, setPinCode] = useState(initialAddress?.pin_code || "");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFirstName(initialData?.first_name || "");
    setLastName(initialData?.last_name || "");
    setPhoneNumber(initialData?.phone_number || "");

    setAddressDetails(initialAddress?.address_details || "");
    setCity(initialAddress?.city || "");
    setState(initialAddress?.state || "");
    setPinCode(initialAddress?.pin_code || "");

    setError("");
  }, [initialData, initialAddress]);

  const validate = () => {
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
      setError("First name, last name, and phone number are required.");
      return false;
    }
    if (!/^\d{10}$/.test(phoneNumber.trim())) {
      setError("Phone number must be 10 digits.");
      return false;
    }
    if (
      !addressDetails.trim() ||
      !city.trim() ||
      !state.trim() ||
      !pinCode.trim()
    ) {
      setError("All address fields are required.");
      return false;
    }
    if (!/^\d{5,6}$/.test(pinCode.trim())) {
      setError("Pin Code must be 5 or 6 digits.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");

    try {
      await onSubmit(
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phoneNumber.trim(),
        },
        {
          address_details: addressDetails.trim(),
          city: city.trim(),
          state: state.trim(),
          pin_code: pinCode.trim(),
        }
      );
    } catch (err) {
      setError(err.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white p-6 rounded shadow space-y-4"
    >
      <h2 className="text-xl font-semibold">Edit Customer & Primary Address</h2>

      {error && <p className="text-red-600">{error}</p>}

      <div>
        <label className="block mb-1 font-medium">First Name</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Last Name</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Phone Number</label>
        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={loading}
          placeholder="10 digit phone number"
        />
      </div>

      <h3 className="text-lg font-semibold mt-4">Primary Address</h3>

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

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Customer & Address"}
      </button>
    </form>
  );
}

export default CustomerForm;
