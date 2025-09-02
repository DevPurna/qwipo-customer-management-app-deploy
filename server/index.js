const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to SQLite database
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("DB connection error:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// Create tables if not exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    address_details TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pin_code TEXT NOT NULL,
    FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
  )`);
});

// Helper: Validate customer input
function validateCustomer(data) {
  const { first_name, last_name, phone_number } = data;
  if (!first_name || !last_name || !phone_number) return false;
  if (!/^\d{10}$/.test(phone_number)) return false;
  return true;
}

// Helper: Validate address input
function validateAddress(data) {
  const { address_details, city, state, pin_code } = data;
  if (!address_details || !city || !state || !pin_code) return false;
  if (!/^\d{5,6}$/.test(pin_code)) return false;
  return true;
}

// POST /api/customers - Create customer + one address
app.post("/api/customers", (req, res) => {
  const {
    first_name,
    last_name,
    phone_number,
    address_details,
    city,
    state,
    pin_code,
  } = req.body;

  if (
    !validateCustomer({ first_name, last_name, phone_number }) ||
    !validateAddress({ address_details, city, state, pin_code })
  ) {
    return res
      .status(400)
      .json({ error: "Invalid or missing customer/address fields" });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    db.run(
      `INSERT INTO customers (first_name, last_name, phone_number) VALUES (?, ?, ?)`,
      [first_name, last_name, phone_number],
      function (err) {
        if (err) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: err.message });
        }
        const customerId = this.lastID;
        db.run(
          `INSERT INTO addresses (customer_id, address_details, city, state, pin_code) VALUES (?, ?, ?, ?, ?)`,
          [customerId, address_details, city, state, pin_code],
          function (err) {
            if (err) {
              db.run("ROLLBACK");
              return res.status(400).json({ error: err.message });
            }
            db.run("COMMIT");
            res.json({
              message: "Customer and address created successfully",
              data: {
                id: customerId,
                first_name,
                last_name,
                phone_number,
                address: {
                  id: this.lastID,
                  address_details,
                  city,
                  state,
                  pin_code,
                },
              },
            });
          }
        );
      }
    );
  });
});

// GET /api/customers - List customers with search, filter, pagination, sorting
app.get("/api/customers", (req, res) => {
  const {
    search = "",
    city = "",
    state = "",
    pin_code = "",
    page = 1,
    limit = 5,
    sortField = "id",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;
  const validSortFields = ["id", "first_name", "last_name", "phone_number"];
  const orderBy = validSortFields.includes(sortField) ? sortField : "id";
  const orderDir = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const searchParam = `%${search}%`;
  const cityParam = `%${city}%`;
  const stateParam = `%${state}%`;
  const pinParam = `%${pin_code}%`;

  // Count total matching customers
  const countSql = `
    SELECT COUNT(DISTINCT customers.id) AS count
    FROM customers
    LEFT JOIN addresses ON customers.id = addresses.customer_id
    WHERE (customers.first_name LIKE ? OR customers.last_name LIKE ? OR customers.phone_number LIKE ?)
      AND (addresses.city LIKE ? OR ? = '')
      AND (addresses.state LIKE ? OR ? = '')
      AND (addresses.pin_code LIKE ? OR ? = '')
  `;

  db.get(
    countSql,
    [
      searchParam,
      searchParam,
      searchParam,
      cityParam,
      city === "" ? "1" : "0",
      stateParam,
      state === "" ? "1" : "0",
      pinParam,
      pin_code === "" ? "1" : "0",
    ],
    (err, countRow) => {
      if (err) return res.status(400).json({ error: err.message });
      const total = countRow.count;

      const sql = `
        SELECT DISTINCT customers.*
        FROM customers
        LEFT JOIN addresses ON customers.id = addresses.customer_id
        WHERE (customers.first_name LIKE ? OR customers.last_name LIKE ? OR customers.phone_number LIKE ?)
          AND (addresses.city LIKE ? OR ? = '')
          AND (addresses.state LIKE ? OR ? = '')
          AND (addresses.pin_code LIKE ? OR ? = '')
        ORDER BY ${orderBy} ${orderDir}
        LIMIT ? OFFSET ?
      `;

      db.all(
        sql,
        [
          searchParam,
          searchParam,
          searchParam,
          cityParam,
          city === "" ? "1" : "0",
          stateParam,
          state === "" ? "1" : "0",
          pinParam,
          pin_code === "" ? "1" : "0",
          limit,
          offset,
        ],
        (err, rows) => {
          if (err) return res.status(400).json({ error: err.message });
          res.json({
            message: "success",
            data: rows,
            pagination: {
              total,
              page: Number(page),
              limit: Number(limit),
              totalPages: Math.ceil(total / limit),
            },
          });
        }
      );
    }
  );
});

// GET /api/customers/:id - Get customer details
app.get("/api/customers/:id", (req, res) => {
  const customerId = req.params.id;
  db.get("SELECT * FROM customers WHERE id = ?", [customerId], (err, row) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Customer not found" });
    res.json({ message: "success", data: row });
  });
});

// GET /api/customers/:id/with-address-count - Customer + address count + flag
app.get("/api/customers/:id/with-address-count", (req, res) => {
  const customerId = req.params.id;
  const sql = `
    SELECT customers.*, COUNT(addresses.id) AS address_count
    FROM customers
    LEFT JOIN addresses ON customers.id = addresses.customer_id
    WHERE customers.id = ?
    GROUP BY customers.id
  `;
  db.get(sql, [customerId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Customer not found" });
    }
    // Convert address_count from string to number if needed
    const addressCount = Number(row.address_count) || 0;

    res.json({
      message: "success",
      data: {
        ...row,
        only_one_address: addressCount === 1,
      },
    });
  });
});

// PUT /api/customers/:id - Update customer info
app.put("/api/customers/:id", (req, res) => {
  const customerId = req.params.id;
  const { first_name, last_name, phone_number } = req.body;

  if (!validateCustomer({ first_name, last_name, phone_number })) {
    return res
      .status(400)
      .json({ error: "Invalid or missing customer fields" });
  }

  db.run(
    `UPDATE customers SET first_name = ?, last_name = ?, phone_number = ? WHERE id = ?`,
    [first_name, last_name, phone_number, customerId],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      if (this.changes === 0)
        return res.status(404).json({ error: "Customer not found" });
      res.json({ message: "Customer updated successfully" });
    }
  );
});

// DELETE /api/customers/:id - Delete customer and addresses
app.delete("/api/customers/:id", (req, res) => {
  const customerId = req.params.id;

  db.run(
    "DELETE FROM addresses WHERE customer_id = ?",
    [customerId],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });

      db.run(
        "DELETE FROM customers WHERE id = ?",
        [customerId],
        function (err) {
          if (err) return res.status(400).json({ error: err.message });
          if (this.changes === 0)
            return res.status(404).json({ error: "Customer not found" });
          res.json({ message: "Customer and addresses deleted successfully" });
        }
      );
    }
  );
});

// GET /api/customers/:id/addresses - Get all addresses for customer
app.get("/api/customers/:id/addresses", (req, res) => {
  const customerId = req.params.id;
  db.all(
    "SELECT * FROM addresses WHERE customer_id = ?",
    [customerId],
    (err, rows) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "success", data: rows });
    }
  );
});

// POST /api/customers/:id/addresses - Add address for customer
app.post("/api/customers/:id/addresses", (req, res) => {
  const customerId = req.params.id;
  const { address_details, city, state, pin_code } = req.body;

  if (!validateAddress({ address_details, city, state, pin_code })) {
    return res.status(400).json({ error: "Invalid or missing address fields" });
  }

  db.get("SELECT * FROM customers WHERE id = ?", [customerId], (err, row) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Customer not found" });

    db.run(
      `INSERT INTO addresses (customer_id, address_details, city, state, pin_code) VALUES (?, ?, ?, ?, ?)`,
      [customerId, address_details, city, state, pin_code],
      function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({
          message: "Address added successfully",
          data: {
            id: this.lastID,
            customer_id: customerId,
            address_details,
            city,
            state,
            pin_code,
          },
        });
      }
    );
  });
});

// PUT /api/addresses/:addressId - Update address
app.put("/api/addresses/:addressId", (req, res) => {
  const addressId = req.params.addressId;
  const { address_details, city, state, pin_code } = req.body;

  if (!validateAddress({ address_details, city, state, pin_code })) {
    return res.status(400).json({ error: "Invalid or missing address fields" });
  }

  db.run(
    `UPDATE addresses SET address_details = ?, city = ?, state = ?, pin_code = ? WHERE id = ?`,
    [address_details, city, state, pin_code, addressId],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      if (this.changes === 0)
        return res.status(404).json({ error: "Address not found" });
      res.json({ message: "Address updated successfully" });
    }
  );
});

// DELETE /api/addresses/:addressId - Delete address
app.delete("/api/addresses/:addressId", (req, res) => {
  const addressId = req.params.addressId;
  db.run("DELETE FROM addresses WHERE id = ?", [addressId], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    if (this.changes === 0)
      return res.status(404).json({ error: "Address not found" });
    res.json({ message: "Address deleted successfully" });
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const path = require("path");

// Serve React build folder
app.use(express.static(path.join(__dirname, "../client/build")));

// Serve React app for any route not handled by API
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
