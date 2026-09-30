import { pool, query } from "./db/index.js";

const BASE_URL = "http://localhost:5000";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
    throw new Error(message);
  } else {
    console.log(`  ✅ PASSED: ${message}`);
    passed++;
  }
}

async function runTests() {
  console.log("\n==========================================");
  console.log("🚀 Starting Slot Booking API Test Suite");
  console.log("==========================================\n");

  const timestamp = Date.now();
  const testEmail1 = `user1_${timestamp}@example.com`;
  const testEmail2 = `user2_${timestamp}@example.com`;
  const testAdminEmail = `admin_${timestamp}@example.com`;
  const testPassword = "securePassword123";

  let user1Token = "";
  let user2Token = "";
  let adminToken = "";
  let user1Id = null;
  let user2Id = null;
  let slotId = null;
  let bookingId = null;

  try {
    // 1. Health check
    console.log("Test 1: Health Check");
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, "Health status is 200");
    assert(healthData.status === "ok", "Health status body is ok");

    // 2. Register User 1
    console.log("\nTest 2: User Registration (POST /api/auth/register)");
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User 1",
        email: testEmail1,
        password: testPassword,
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, "Register returns 201");
    assert(!!regData.token, "JWT token is returned");
    assert(regData.user.email === testEmail1, "Returned email matches");
    user1Token = regData.token;
    user1Id = regData.user.id;

    // 3. Register Validation (short password)
    console.log("\nTest 3: Registration Validation (password < 6 chars)");
    const invalidRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Invalid User",
        email: `invalid_${timestamp}@example.com`,
        password: "123",
      }),
    });
    assert(invalidRegRes.status === 400, "Short password returns 400");

    // 4. Duplicate Registration
    console.log("\nTest 4: Duplicate Email Registration");
    const dupRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate User",
        email: testEmail1,
        password: testPassword,
      }),
    });
    assert(dupRegRes.status === 409, "Duplicate email returns 409 Conflict");

    // 5. User Login
    console.log("\nTest 5: User Login (POST /api/auth/login)");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail1,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, "Login returns 200");
    assert(!!loginData.token, "Login returns valid JWT token");

    // 6. Invalid Login
    console.log("\nTest 6: Invalid Password Login");
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail1,
        password: "wrongPassword",
      }),
    });
    assert(badLoginRes.status === 401, "Invalid password returns 401");

    // 7. Setup Admin User & Token
    console.log("\nTest 7: Admin Account Creation & Role Check");
    const adminRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Admin User",
        email: testAdminEmail,
        password: testPassword,
      }),
    });
    const adminRegData = await adminRegRes.json();
    // Promote user to ADMIN in DB
    await query("UPDATE users SET role = 'ADMIN' WHERE id = $1", [adminRegData.user.id]);
    
    // Login as admin to get new token with ADMIN role
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testAdminEmail,
        password: testPassword,
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.token;
    assert(adminLoginData.user.role === "ADMIN", "User updated to ADMIN");

    // 8. Slot creation authorization (non-admin forbidden)
    console.log("\nTest 8: Slot Creation Permissions (POST /api/slots)");
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const endTime = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

    const nonAdminSlotRes = await fetch(`${BASE_URL}/api/slots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        startTime,
        endTime,
        capacity: 1,
      }),
    });
    assert(nonAdminSlotRes.status === 403, "Non-admin creating slot returns 403 Forbidden");

    // 9. Admin creates slot
    console.log("\nTest 9: Admin Slot Creation (POST /api/slots)");
    const adminSlotRes = await fetch(`${BASE_URL}/api/slots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        startTime,
        endTime,
        capacity: 1,
      }),
    });
    const slotData = await adminSlotRes.json();
    assert(adminSlotRes.status === 201, "Admin creates slot with 201");
    assert(slotData.capacity === 1, "Slot capacity is 1");
    slotId = slotData.id;

    // 10. List slots
    console.log("\nTest 10: List Slots (GET /api/slots)");
    const from = new Date(now.getTime()).toISOString();
    const to = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
    const listRes = await fetch(
      `${BASE_URL}/api/slots?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );
    const listData = await listRes.json();
    assert(listRes.status === 200, "Slots list returns 200");
    const foundSlot = listData.find((s) => s.id === slotId);
    assert(!!foundSlot, "Newly created slot appears in list");
    assert(foundSlot.isFull === false, "Slot is not full");

    // 11. Book slot (POST /api/bookings)
    console.log("\nTest 11: Book Slot (POST /api/bookings)");
    const bookRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ slotId }),
    });
    const bookData = await bookRes.json();
    assert(bookRes.status === 201, "Booking returns 201 Created");
    assert(bookData.slotId === slotId, "Booking slotId matches");
    bookingId = bookData.id;

    // 12. Duplicate Booking by same user
    console.log("\nTest 12: Duplicate Booking by same user");
    const dupBookRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ slotId }),
    });
    assert(dupBookRes.status === 409, "Duplicate booking returns 409");

    // 13. Check User Bookings (GET /api/bookings/me)
    console.log("\nTest 13: Get My Bookings (GET /api/bookings/me)");
    const myBookingsRes = await fetch(`${BASE_URL}/api/bookings/me`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const myBookingsData = await myBookingsRes.json();
    assert(myBookingsRes.status === 200, "My bookings returns 200");
    const myB = myBookingsData.find((b) => b.id === bookingId);
    assert(!!myB, "Booking appears in user list with joined slot details");

    // 14. Concurrent Booking Race Condition Test (Double Booking Protection)
    console.log("\nTest 14: Concurrent Double Booking Protection (SELECT ... FOR UPDATE)");
    // Create another slot with capacity 1
    const start2 = new Date(now.getTime() + 30 * 60 * 60 * 1000).toISOString();
    const end2 = new Date(now.getTime() + 31 * 60 * 60 * 1000).toISOString();
    const slot2Res = await fetch(`${BASE_URL}/api/slots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        startTime: start2,
        endTime: end2,
        capacity: 1,
      }),
    });
    const slot2Data = await slot2Res.json();
    const raceSlotId = slot2Data.id;

    // Register User 2
    const reg2Res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User 2",
        email: testEmail2,
        password: testPassword,
      }),
    });
    const reg2Data = await reg2Res.json();
    user2Token = reg2Data.token;

    // Concurrently book raceSlotId by User 1 and User 2
    const [resA, resB] = await Promise.all([
      fetch(`${BASE_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({ slotId: raceSlotId }),
      }),
      fetch(`${BASE_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user2Token}`,
        },
        body: JSON.stringify({ slotId: raceSlotId }),
      }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    assert(
      statuses[0] === 201 && statuses[1] === 409,
      `Double-booking prevented: exactly one 201 and one 409 (got ${resA.status} and ${resB.status})`
    );

    // 15. Cancel Booking (DELETE /api/bookings/:id)
    console.log("\nTest 15: Cancel Booking (DELETE /api/bookings/:id)");
    const cancelRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert(cancelRes.status === 200, "Booking cancelled successfully");

    // 16. Delete Slot (DELETE /api/slots/:id)
    console.log("\nTest 16: Delete Slot (DELETE /api/slots/:id)");
    const delSlotRes = await fetch(`${BASE_URL}/api/slots/${slotId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(delSlotRes.status === 200, "Slot deleted successfully");

    // Cleanup race slot
    await fetch(`${BASE_URL}/api/slots/${raceSlotId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    console.log("\n==========================================");
    console.log(`🎉 ALL TESTS PASSED! (${passed}/${passed})`);
    console.log("==========================================\n");
  } catch (error) {
    console.error("\n💥 Test execution halted with error:", error.message);
  } finally {
    // Cleanup created test users
    try {
      await query("DELETE FROM users WHERE email IN ($1, $2, $3)", [
        testEmail1,
        testEmail2,
        testAdminEmail,
      ]);
      console.log("🧹 Test data cleaned up successfully.");
    } catch (e) {
      console.error("Cleanup error:", e);
    }
    await pool.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
