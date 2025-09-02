import React, { useState, useEffect } from "react";

function CustomerForm({
  initialData = {},
  onSubmitSuccess,
  onCancel,
  showAddressFields = true,
}) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    address_details: "",
    city: "",
    state: "",
    pin_code: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        first_name: initialData.first_name || "",
        last_name: initialData.last_name || "",
        phone_number: initialData.phone_number || "",
        address_details:
          initialData.address_details ||
          initialData.address?.address_details ||
          "",
        city: initialData.city || initialData.address?.city || "",
        state: initialData.state || initialData.address?.state || "",
        pin_code: initialData.pin_code || initialData.address?.pin_code || "",
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors = {};
    if (!formData.first_name.trim())
      newErrors.first_name = "First name is required.";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last name is required.";
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required.";
    } else if (!/^\d{10}$/.test(formData.phone_number.trim())) {
      newErrors.phone_number = "Phone number must be 10 digits.";
    }

    if (showAddressFields) {
      if (!formData.address_details.trim())
        newErrors.address_details = "Address is required.";
      if (!formData.city.trim()) newErrors.city = "City is required.";
      if (!formData.state.trim()) newErrors.state = "State is required.";
      if (!formData.pin_code.trim()) {
        newErrors.pin_code = "Pin code is required.";
      } else if (!/^\d{5,6}$/.test(formData.pin_code.trim())) {
        newErrors.pin_code = "Pin code must be 5 or 6 digits.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setSubmitError("");
    setSubmitSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const url = initialData?.id
        ? `http://localhost:5000/api/customers/${initialData.id}`
        : "http://localhost:5000/api/customers";

      const method = initialData?.id ? "PUT" : "POST";

      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone_number: formData.phone_number.trim(),
      };

      if (showAddressFields) {
        payload.address_details = formData.address_details.trim();
        payload.city = formData.city.trim();
        payload.state = formData.state.trim();
        payload.pin_code = formData.pin_code.trim();
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit form.");
      }

      if (!initialData?.id) {
        setSubmitSuccess("Customer created successfully.");
        setFormData({
          first_name: "",
          last_name: "",
          phone_number: "",
          address_details: "",
          city: "",
          state: "",
          pin_code: "",
        });
        setTimeout(() => {
          if (onSubmitSuccess) onSubmitSuccess();
        }, 1500);
      } else {
        setSubmitSuccess("Customer updated successfully.");
        if (onSubmitSuccess) onSubmitSuccess();
      }
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white p-6 rounded shadow space-y-4"
      noValidate
    >
      {submitError && <p className="text-red-600">{submitError}</p>}
      {submitSuccess && <p className="text-green-600">{submitSuccess}</p>}

      {[
        { label: "First Name", name: "first_name", type: "text" },
        { label: "Last Name", name: "last_name", type: "text" },
        {
          label: "Phone Number",
          name: "phone_number",
          type: "text",
          placeholder: "10 digit number",
        },
      ].map(({ label, name, type, placeholder }) => (
        <div key={name}>
          <label className="block mb-1 font-medium" htmlFor={name}>
            {label}
          </label>
          <input
            id={name}
            name={name}
            type={type}
            value={formData[name]}
            onChange={handleChange}
            placeholder={placeholder || ""}
            className={`w-full p-2 border rounded ${
              errors[name] ? "border-red-600" : "border-gray-300"
            }`}
            disabled={loading}
          />
          {errors[name] && (
            <p className="text-red-600 text-sm">{errors[name]}</p>
          )}
        </div>
      ))}

      {showAddressFields && (
        <>
          {[
            { label: "Address Details", name: "address_details", type: "text" },
            { label: "City", name: "city", type: "text" },
            { label: "State", name: "state", type: "text" },
            {
              label: "Pin Code",
              name: "pin_code",
              type: "text",
              placeholder: "5 or 6 digit code",
            },
          ].map(({ label, name, type, placeholder }) => (
            <div key={name}>
              <label className="block mb-1 font-medium" htmlFor={name}>
                {label}
              </label>
              <input
                id={name}
                name={name}
                type={type}
                value={formData[name]}
                onChange={handleChange}
                placeholder={placeholder || ""}
                className={`w-full p-2 border rounded ${
                  errors[name] ? "border-red-600" : "border-gray-300"
                }`}
                disabled={loading}
              />
              {errors[name] && (
                <p className="text-red-600 text-sm">{errors[name]}</p>
              )}
            </div>
          ))}
        </>
      )}

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? initialData?.id
              ? "Updating..."
              : "Creating..."
            : initialData?.id
            ? "Update Customer"
            : "Create Customer"}
        </button>
        {onCancel && (
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

export default CustomerForm;
