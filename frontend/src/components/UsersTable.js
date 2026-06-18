import { useEffect, useState } from "react";
import axios from "axios";

function UsersTable({ token }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/users/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err));
  }, [token]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Registered Users</h2>
      <table className="styled-table" border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Date Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.date_joined}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UsersTable;
