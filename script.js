
const vehicles = [
    {
        id: 1,
        name: "Hyundai Creta",
        type: "car",
        price: 2500,
        rating: 4.8,
        seats: 5,
        fuel: "Petrol",
        transmission: "Automatic",
        description: "A comfortable SUV for family trips and city drives.",
        image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80",
        maintenance: false
    },
    {
        id: 2,
        name: "Maruti Swift",
        type: "car",
        price: 1600,
        rating: 4.6,
        seats: 5,
        fuel: "Petrol",
        transmission: "Manual",
        description: "An economical hatchback for everyday travel.",
        image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
        maintenance: false
    },
    {
        id: 3,
        name: "Royal Enfield Classic",
        type: "bike",
        price: 900,
        rating: 4.9,
        seats: 2,
        fuel: "Petrol",
        transmission: "Manual",
        description: "A classic motorcycle for memorable road trips.",
        image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80",
        maintenance: false
    },
    {
        id: 4,
        name: "Yamaha MT-15",
        type: "bike",
        price: 750,
        rating: 4.7,
        seats: 2,
        fuel: "Petrol",
        transmission: "Manual",
        description: "A sporty bike for exciting city rides.",
        image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
        maintenance: false
    },
    {
        id: 5,
        name: "Honda Activa",
        type: "scooter",
        price: 450,
        rating: 4.6,
        seats: 2,
        fuel: "Petrol",
        transmission: "Automatic",
        description: "A convenient scooter for local travel.",
        image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80",
        maintenance: false
    },
    {
        id: 6,
        name: "Electric Scooter",
        type: "scooter",
        price: 550,
        rating: 4.5,
        seats: 2,
        fuel: "Electric",
        transmission: "Automatic",
        description: "A modern electric ride for short journeys.",
        image: "https://images.unsplash.com/photo-1604868189265-219ba7a1a8b1?auto=format&fit=crop&w=800&q=80",
        maintenance: false
    }
];

const STORAGE_KEY = "driveEaseBookings";
const MAINTENANCE_KEY = "driveEaseMaintenance";

let bookings = loadBookings();
let maintenanceIds = loadMaintenance();
let selectedVehicle = null;
let searchType = "all";
let searchStart = "";
let searchEnd = "";
let toastTimer;

// ---------- SAFE BROWSER STORAGE ----------

function loadBookings() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function loadMaintenance() {
    try {
        const data = JSON.parse(
            localStorage.getItem(MAINTENANCE_KEY) || "[]"
        );
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
        localStorage.setItem(
            MAINTENANCE_KEY,
            JSON.stringify(maintenanceIds)
        );
        return true;
    } catch {
        showToast("Could not save data. Check your browser storage.");
        return false;
    }
}

// ---------- HELPER FUNCTIONS ----------

function formatPrice(amount) {
    return "₹" + amount.toLocaleString("en-IN");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function isValidDateRange(start, end) {
    const today = localDateString();

    return Boolean(
        start &&
        end &&
        start >= today &&
        end > start
    );
}

function calculateDays(start, end) {
    const startTime = new Date(start + "T00:00:00").getTime();
    const endTime = new Date(end + "T00:00:00").getTime();

    return Math.round((endTime - startTime) / 86400000);
}

// Two rentals conflict when their date ranges overlap.
// A return date is treated as the end of the rental period.
function datesOverlap(startA, endA, startB, endB) {
    return startA < endB && startB < endA;
}

function isUnderMaintenance(vehicle) {
    return maintenanceIds.includes(vehicle.id);
}

function isAvailable(vehicle, start, end, ignoreBookingId = null) {
    if (isUnderMaintenance(vehicle)) {
        return false;
    }

    return !bookings.some(booking => {
        if (
            booking.vehicleId !== vehicle.id ||
            booking.status !== "Confirmed" ||
            booking.id === ignoreBookingId
        ) {
            return false;
        }

        return datesOverlap(
            start,
            end,
            booking.pickup,
            booking.returnDate
        );
    });
}

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

// ---------- VEHICLE LISTINGS ----------

function renderVehicles() {
    const list = document.getElementById("vehicle-list");
    const emptyMessage = document.getElementById("empty-message");
    const sortOrder = document.getElementById("sort-price").value;

    let results = vehicles.filter(vehicle => {
        const matchesType =
            searchType === "all" || vehicle.type === searchType;

        const matchesDates = !searchStart || !searchEnd ||
            isAvailable(vehicle, searchStart, searchEnd);

        return matchesType && matchesDates;
    });

    if (sortOrder === "low") {
        results.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "high") {
        results.sort((a, b) => b.price - a.price);
    }

    document.getElementById("vehicle-count").textContent =
        vehicles.length + "+";

    emptyMessage.hidden = results.length > 0;

    list.innerHTML = results.map(vehicle => {
        const available = !isUnderMaintenance(vehicle) &&
            (!searchStart || !searchEnd ||
                isAvailable(vehicle, searchStart, searchEnd));

        return `
            <article class="vehicle-card">
                <div class="vehicle-image">
                    <img
                        src="${vehicle.image}"
                        alt="${escapeHTML(vehicle.name)}"
                        loading="lazy"
                        onerror="this.onerror=null;this.src='https://placehold.co/800x450/f1f4ed/26372b?text=Vehicle+Photo'">
                    <span class="vehicle-tag">
                        ${escapeHTML(vehicle.type)}
                    </span>
                </div>

                <div class="vehicle-details">
                    <div class="vehicle-title-row">
                        <h3>${escapeHTML(vehicle.name)}</h3>
                        <span class="rating">★ ${vehicle.rating}</span>
                    </div>

                    <p class="vehicle-description">
                        ${escapeHTML(vehicle.description)}
                    </p>

                    <div class="vehicle-specs">
                        <span>👥 ${vehicle.seats} seats</span>
                        <span>⛽ ${escapeHTML(vehicle.fuel)}</span>
                        <span>${escapeHTML(vehicle.transmission)}</span>
                    </div>

                    <div class="vehicle-footer">
                        <div class="vehicle-price">
                            <strong>${formatPrice(vehicle.price)}</strong>
                            <small>per day · demo price</small>
                        </div>

                        <button
                            class="book-button"
                            data-book="${vehicle.id}"
                            ${available ? "" : "disabled"}>
                            ${available ? "Book Now →" : "Unavailable"}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");

    renderAdmin();
}

// ---------- SEARCH AND FILTERS ----------

document.getElementById("search-form").addEventListener("submit", event => {
    event.preventDefault();

    const start = document.getElementById("pickup-date").value;
    const end = document.getElementById("return-date").value;
    const message = document.getElementById("search-message");

    if (!isValidDateRange(start, end)) {
        message.textContent =
            "Choose a pickup date today or later and a return date after pickup.";
        return;
    }

    searchType = document.getElementById("search-type").value;
    searchStart = start;
    searchEnd = end;

    message.textContent =
        "Showing vehicles available for your selected dates.";

    renderVehicles();

    document.getElementById("vehicles").scrollIntoView({
        behavior: "smooth"
    });
});

document.getElementById("sort-price").addEventListener("change", renderVehicles);

// Set minimum dates in search and booking forms.
function setDateLimits() {
    const today = localDateString();

    ["pickup-date", "return-date", "booking-pickup", "booking-return"]
        .forEach(id => {
            document.getElementById(id).min = today;
        });
}

document.getElementById("pickup-date").addEventListener("change", event => {
    document.getElementById("return-date").min = event.target.value || localDateString();
});

document.getElementById("booking-pickup").addEventListener("change", event => {
    const returnInput = document.getElementById("booking-return");

    returnInput.min = event.target.value || localDateString();

    if (returnInput.value && returnInput.value <= event.target.value) {
        returnInput.value = "";
    }

    updateEstimatedPrice();
});

document.getElementById("booking-return").addEventListener("change", updateEstimatedPrice);

// ---------- BOOKING FORM ----------

const modal = document.getElementById("booking-modal");

function openBooking(vehicleId) {
    selectedVehicle = vehicles.find(vehicle => vehicle.id === vehicleId);

    if (!selectedVehicle) {
        return;
    }

    if (isUnderMaintenance(selectedVehicle)) {
        showToast("This vehicle is under maintenance.");
        return;
    }

    const pickup = searchStart || localDateString();
    const nextDay = new Date(pickup + "T00:00:00");
    nextDay.setDate(nextDay.getDate() + 1);
    const returnDate = searchEnd || localDateString(nextDay);

    document.getElementById("vehicle-id").value = selectedVehicle.id;
    document.getElementById("selected-vehicle").textContent =
        `${selectedVehicle.name} · ${formatPrice(selectedVehicle.price)} per day`;

    document.getElementById("booking-pickup").value = pickup;
    document.getElementById("booking-return").value = returnDate;
    document.getElementById("booking-pickup").min = localDateString();
    document.getElementById("booking-return").min = pickup;
    document.getElementById("booking-message").textContent = "";

    updateEstimatedPrice();

    modal.hidden = false;
    document.body.style.overflow = "hidden";
}

function closeBooking() {
    modal.hidden = true;
    document.body.style.overflow = "";
    selectedVehicle = null;
}

document.getElementById("vehicle-list").addEventListener("click", event => {
    const button = event.target.closest("[data-book]");

    if (button && !button.disabled) {
        openBooking(Number(button.dataset.book));
    }
});

document.getElementById("close-modal").addEventListener("click", closeBooking);

modal.addEventListener("click", event => {
    if (event.target === modal) {
        closeBooking();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) {
        closeBooking();
    }
});

function updateEstimatedPrice() {
    if (!selectedVehicle) {
        return;
    }

    const start = document.getElementById("booking-pickup").value;
    const end = document.getElementById("booking-return").value;

    let total = 0;

    if (isValidDateRange(start, end)) {
        total = calculateDays(start, end) * selectedVehicle.price;
    }

    document.getElementById("estimated-price").textContent =
        formatPrice(total);
}

document.getElementById("booking-form").addEventListener("submit", event => {
    event.preventDefault();

    const message = document.getElementById("booking-message");
    const vehicle = selectedVehicle;

    if (!vehicle) {
        message.textContent = "Please select a vehicle first.";
        return;
    }

    const name = document.getElementById("customer-name").value.trim();
    const phone = document.getElementById("customer-phone").value.trim();
    const pickup = document.getElementById("booking-pickup").value;
    const returnDate = document.getElementById("booking-return").value;

    if (!name || !/^[6-9][0-9]{9}$/.test(phone)) {
        message.textContent = "Enter your name and a valid 10-digit Indian mobile number.";
        return;
    }

    if (!isValidDateRange(pickup, returnDate)) {
        message.textContent = "Select valid pickup and return dates.";
        return;
    }

    if (!isAvailable(vehicle, pickup, returnDate)) {
        message.textContent =
            "This vehicle is not available for these dates. Please select different dates.";
        return;
    }

    const days = calculateDays(pickup, returnDate);

    const booking = {
        id: Date.now().toString(),
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        customerName: name,
        phone: phone,
        pickup: pickup,
        returnDate: returnDate,
        days: days,
        total: days * vehicle.price,
        status: "Confirmed",
        createdAt: new Date().toISOString()
    };

    bookings.unshift(booking);

    if (!saveData()) {
        bookings.shift();
        return;
    }

    closeBooking();
    renderAll();

    showToast("Demo booking confirmed successfully!");

    document.getElementById("bookings").scrollIntoView({
        behavior: "smooth"
    });
});

// ---------- BOOKING HISTORY AND CANCELLATIONS ----------

function renderBookings() {
    const list = document.getElementById("booking-list");

    if (bookings.length === 0) {
        list.innerHTML = `
            <div class="empty-bookings">
                You have no bookings yet. Explore vehicles and book your first ride!
            </div>
        `;
        return;
    }

    list.innerHTML = bookings.map(booking => `
        <article class="booking-card">
            <div>
                <h3>${escapeHTML(booking.vehicleName)}</h3>
                <p>Booking ID: ${escapeHTML(booking.id)}</p>
                <p>Customer: ${escapeHTML(booking.customerName)}</p>
                <p>Pickup: ${escapeHTML(booking.pickup)}</p>
                <p>Return: ${escapeHTML(booking.returnDate)}</p>
                <p>Duration: ${booking.days} day(s)</p>
            </div>

            <div class="booking-side">
                <strong>${formatPrice(booking.total)}</strong>
                <span class="status ${booking.status === "Cancelled" ? "cancelled" : ""}">
                    ${escapeHTML(booking.status)}
                </span>

                ${booking.status === "Confirmed" ? `
                    <div>
                        <button class="cancel-button"
                            data-cancel="${escapeHTML(booking.id)}">
                            Cancel booking
                        </button>
                    </div>
                ` : ""}
            </div>
        </article>
    `).join("");
}

document.getElementById("booking-list").addEventListener("click", event => {
    const button = event.target.closest("[data-cancel]");

    if (!button) {
        return;
    }

    const booking = bookings.find(
        item => item.id === button.dataset.cancel
    );

    if (!booking || booking.status !== "Confirmed") {
        return;
    }

    if (!confirm("Are you sure you want to cancel this demo booking?")) {
        return;
    }

    booking.status = "Cancelled";

    if (!saveData()) {
        booking.status = "Confirmed";
        return;
    }

    renderAll();
    showToast("Booking cancelled.");
});

// ---------- ADMIN DASHBOARD ----------

function renderAdmin() {
    const confirmedBookings = bookings.filter(
        booking => booking.status === "Confirmed"
    );

    document.getElementById("admin-vehicles").textContent = vehicles.length;
    document.getElementById("admin-bookings").textContent = bookings.length;
    document.getElementById("admin-confirmed").textContent =
        confirmedBookings.length;
    document.getElementById("admin-maintenance").textContent =
        maintenanceIds.length;

    const list = document.getElementById("admin-vehicle-list");

    list.innerHTML = vehicles.map(vehicle => {
        const maintenance = isUnderMaintenance(vehicle);

        return `
            <div class="admin-vehicle-row">
                <div>
                    <strong>${escapeHTML(vehicle.name)}</strong>
                    <small>${escapeHTML(vehicle.type)} · ${formatPrice(vehicle.price)}/day</small>
                    <br>
                    <span class="availability ${maintenance ? "maintenance" : ""}">
                        ${maintenance ? "Under maintenance" : "Available for booking"}
                    </span>
                </div>

                <button class="maintenance-button"
                    data-maintenance="${vehicle.id}">
                    ${maintenance ? "Mark available" : "Send to maintenance"}
                </button>
            </div>
        `;
    }).join("");
}

document.getElementById("admin-vehicle-list").addEventListener("click", event => {
    const button = event.target.closest("[data-maintenance]");

    if (!button) {
        return;
    }

    const vehicleId = Number(button.dataset.maintenance);
    const index = maintenanceIds.indexOf(vehicleId);

    if (index >= 0) {
        maintenanceIds.splice(index, 1);
    } else {
        const hasFutureBooking = bookings.some(booking =>
            booking.vehicleId === vehicleId &&
            booking.status === "Confirmed" &&
            booking.returnDate > localDateString()
        );

        if (hasFutureBooking) {
            showToast("This vehicle has a confirmed booking. Cancel or complete the booking first.");
            return;
        }

        maintenanceIds.push(vehicleId);
    }

    if (!saveData()) {
        if (index >= 0) {
            maintenanceIds.push(vehicleId);
        } else {
            maintenanceIds.pop();
        }
        return;
    }

    renderAll();

    showToast(
        index >= 0
            ? "Vehicle marked available."
            : "Vehicle sent for maintenance."
    );
});

// ---------- INITIALIZE WEBSITE ----------

function renderAll() {
    renderVehicles();
    renderBookings();
    renderAdmin();
}

setDateLimits();
renderAll();
