INSERT INTO vehicle
(reg_number, status, type, capacity)
VALUES
('NB-1234', 'ACTIVE', 'BUS', 25);

INSERT INTO vehicle
(reg_number, status, type, capacity)
VALUES
('NC-5678', 'ACTIVE', 'VAN', 12);

INSERT INTO vehicle
(reg_number, status, type, capacity)
VALUES
('ND-9012', 'MAINTENANCE', 'BUS', 30);

INSERT INTO vehicle
(reg_number, status, type, capacity)
VALUES
('NE-3456', 'ACTIVE', 'MINI_BUS', 20);

INSERT INTO vehicle
(reg_number, status, type, capacity)
VALUES
('NF-7890', 'INACTIVE', 'VAN', 10);

SELECT * FROM vehicle;

INSERT INTO driver
(name, license_no, contact, status)
VALUES
('Kasun Perera', 'B1234567', '0771234567', 'ACTIVE');

INSERT INTO driver
(name, license_no, contact, status)
VALUES
('Nimal Fernando', 'B7654321', '0719876543', 'ACTIVE');

INSERT INTO driver
(name, license_no, contact, status)
VALUES
('Amal Silva', 'B4567890', '0764567890', 'ON_LEAVE');

INSERT INTO driver
(name, license_no, contact, status)
VALUES
('Saman Kumara', 'B3456789', '0751112233', 'ACTIVE');

INSERT INTO driver
(name, license_no, contact, status)
VALUES
('Ruwan Jayasinghe', 'B9876543', '0782223344', 'ACTIVE');

--------------------------------------------------------------------------------
INSERT INTO route
(origin, destination, distance_km)
VALUES
('Colombo', 'Kandy', 115.00);

INSERT INTO route
(origin, destination, distance_km)
VALUES
('Colombo', 'Galle', 125.00);

INSERT INTO route
(origin, destination, distance_km)
VALUES
('Kandy', 'Nuwara Eliya', 77.00);

INSERT INTO route
(origin, destination, distance_km)
VALUES
('Colombo', 'Negombo', 38.00);

INSERT INTO route
(origin, destination, distance_km)
VALUES
('Galle', 'Matara', 45.00);

--------------------------------------------------------------------------------
INSERT INTO passenger
(name, email, contact)
VALUES
('Nimal Perera', 'nimal@gmail.com', '0771234567');

INSERT INTO passenger
(name, email, contact)
VALUES
('Kavindu Silva', 'kavindu@gmail.com', '0719876543');

INSERT INTO passenger
(name, email, contact)
VALUES
('Tharushi Fernando', 'tharushi@gmail.com', '0764567890');

INSERT INTO passenger
(name, email, contact)
VALUES
('Dilshan Kumar', 'dilshan@gmail.com', '0751234567');

INSERT INTO passenger
(name, email, contact)
VALUES
('Sachini Perera', 'sachini@gmail.com', '0789876543');

--------------------------------------------------------------------------------
INSERT INTO maintenance
(cost, description, service_date, vehicle_id)
VALUES
(25000, 'Engine service and oil replacement',
 DATE '2026-09-15', 1);

INSERT INTO maintenance
(cost, description, service_date, vehicle_id)
VALUES
(18000, 'Brake inspection and replacement',
 DATE '2026-10-05', 2);

INSERT INTO maintenance
(cost, description, service_date, vehicle_id)
VALUES
(12000, 'General vehicle inspection',
 DATE '2026-10-08', 3);

INSERT INTO maintenance
(cost, description, service_date, vehicle_id)
VALUES
(15000, 'Tyre replacement',
 DATE '2026-08-20', 4);

INSERT INTO maintenance
(cost, description, service_date, vehicle_id)
VALUES
(10000, 'Air conditioning service',
 DATE '2026-09-25', 5);
 ------------------------------------------------------------------------------------
INSERT INTO trip
(vehicle_id, driver_id, route_id, departure_time, arrival_time, status)
VALUES
(
    1,
    1,
    1,
    TIMESTAMP '2026-10-10 06:30:00',
    TIMESTAMP '2026-10-10 10:00:00',
    'SCHEDULED'
);

INSERT INTO trip
(vehicle_id, driver_id, route_id, departure_time, arrival_time, status)
VALUES
(
    2,
    2,
    2,
    TIMESTAMP '2026-10-10 08:00:00',
    TIMESTAMP '2026-10-10 10:45:00',
    'SCHEDULED'
);

INSERT INTO trip
(vehicle_id, driver_id, route_id, departure_time, arrival_time, status)
VALUES
(
    4,
    4,
    3,
    TIMESTAMP '2026-10-09 07:00:00',
    TIMESTAMP '2026-10-09 09:30:00',
    'COMPLETED'
);

INSERT INTO trip
(vehicle_id, driver_id, route_id, departure_time, arrival_time, status)
VALUES
(
    1,
    5,
    4,
    TIMESTAMP '2026-10-11 09:00:00',
    TIMESTAMP '2026-10-11 10:00:00',
    'SCHEDULED'
);

INSERT INTO trip
(vehicle_id, driver_id, route_id, departure_time, arrival_time, status)
VALUES
(
    2,
    1,
    5,
    TIMESTAMP '2026-10-12 14:00:00',
    TIMESTAMP '2026-10-12 15:00:00',
    'SCHEDULED'
);
-------------------------------------------------------------------------------
INSERT INTO ticket
(seat_no, booking_status, trip_id, passenger_id)
VALUES
('A05', 'CONFIRMED', 1, 1);

INSERT INTO ticket
(seat_no, booking_status, trip_id, passenger_id)
VALUES
('B08', 'CONFIRMED', 2, 2);

INSERT INTO ticket
(seat_no, booking_status, trip_id, passenger_id)
VALUES
('A12', 'CANCELLED', 3, 3);

INSERT INTO ticket
(seat_no, booking_status, trip_id, passenger_id)
VALUES
('C03', 'BOOKED', 4, 4);

INSERT INTO ticket
(seat_no, booking_status, trip_id, passenger_id)
VALUES
('D07', 'CONFIRMED', 5, 5);
--------------------------------------------------------------------------------
INSERT INTO payment
(amount, method, payment_status, payment_date, ticket_id)
VALUES
(850.00, 'CARD', 'PAID', DATE '2026-10-08', 1);

INSERT INTO payment
(amount, method, payment_status, payment_date, ticket_id)
VALUES
(950.00, 'CASH', 'PAID', DATE '2026-10-08', 2);

INSERT INTO payment
(amount, method, payment_status, payment_date, ticket_id)
VALUES
(700.00, 'ONLINE', 'REFUNDED', DATE '2026-10-07', 3);

INSERT INTO payment
(amount, method, payment_status, payment_date, ticket_id)
VALUES
(500.00, 'WALLET', 'PENDING', DATE '2026-10-09', 4);

INSERT INTO payment
(amount, method, payment_status, payment_date, ticket_id)
VALUES
(600.00, 'CARD', 'PAID', DATE '2026-10-09', 5);
--------------------------------------------------------------------------------
INSERT INTO feedback
(rating, comments, passenger_id, trip_id)
VALUES
(
    5,
    'Excellent service and comfortable journey.',
    1,
    1
);

INSERT INTO feedback
(rating, comments, passenger_id, trip_id)
VALUES
(
    4,
    'Good service but the bus was slightly delayed.',
    2,
    2
);

INSERT INTO feedback
(rating, comments, passenger_id, trip_id)
VALUES
(
    3,
    'Journey was okay. Cleanliness could be improved.',
    3,
    3
);

INSERT INTO feedback
(rating, comments, passenger_id, trip_id)
VALUES
(
    5,
    'Very friendly driver and smooth journey.',
    4,
    4
);

INSERT INTO feedback
(rating, comments, passenger_id, trip_id)
VALUES
(
    4,
    'Good overall experience.',
    5,
    5
);

COMMIT;

--------------------------------------------------------------------------------
SELECT COUNT(*) AS vehicle_count FROM vehicle;

SELECT COUNT(*) AS driver_count FROM driver;

SELECT COUNT(*) AS route_count FROM route;

SELECT COUNT(*) AS passenger_count FROM passenger;

SELECT COUNT(*) AS maintenance_count FROM maintenance;

SELECT COUNT(*) AS trip_count FROM trip;

SELECT COUNT(*) AS ticket_count FROM ticket;

SELECT COUNT(*) AS payment_count FROM payment;

SELECT COUNT(*) AS feedback_count FROM feedback;

-------------------------------------------------------------------------------
SELECT
    t.trip_id,
    v.reg_number,
    d.name AS driver_name,
    r.origin,
    r.destination,
    t.departure_time,
    t.status
FROM trip t
JOIN vehicle v
    ON t.vehicle_id = v.vehicle_id
JOIN driver d
    ON t.driver_id = d.driver_id
JOIN route r
    ON t.route_id = r.route_id
ORDER BY t.trip_id;



SELECT
    SYS_CONTEXT('USERENV', 'DB_NAME') AS DB_NAME,
    SYS_CONTEXT('USERENV', 'SERVICE_NAME') AS SERVICE_NAME
FROM dual;

SELECT USER FROM dual;

SELECT table_name
FROM user_tables
ORDER BY table_name;
SELECT COUNT(*) AS vehicle_count
FROM vehicle;


SELECT table_name, column_name, data_type, data_length
FROM user_tab_columns
WHERE UPPER(table_name) IN ('TRIP', 'TICKET', 'PAYMENT')
ORDER BY table_name, column_id;
----------------------------------------------------------------------------------

--- Add fare to each trip
ALTER TABLE trip
ADD fare NUMBER(10,2) DEFAULT 0 NOT NULL;

--Save the fare charged for each ticket
ALTER TABLE ticket
ADD amount NUMBER(10,2) DEFAULT 0 NOT NULL;

--Set sample fares for the routes
UPDATE trip SET fare = 1500 WHERE route_id = 1; -- Colombo-Kandy
UPDATE trip SET fare = 1200 WHERE route_id = 2; -- Colombo-Galle
UPDATE trip SET fare = 1000 WHERE route_id = 3; -- Kandy-Nuwara Eliya
UPDATE trip SET fare = 500  WHERE route_id = 4; -- Colombo-Negombo
UPDATE trip SET fare = 600  WHERE route_id = 5; -- Galle-Matara

-- the fare for existing tickets
UPDATE ticket tk
SET amount = (
    SELECT t.fare
    FROM trip t
    WHERE t.trip_id = tk.trip_id
);

COMMIT;

--Verify trip fares
SELECT
    t.trip_id,
    r.origin,
    r.destination,
    t.fare
FROM trip t
JOIN route r ON r.route_id = t.route_id
ORDER BY t.trip_id;

--Verify ticket amounts
SELECT
    ticket_id,
    trip_id,
    passenger_id,
    booking_status,
    amount
FROM ticket
ORDER BY ticket_id;

-- Verify payment amounts
SELECT
    payment_id,
    ticket_id,
    amount,
    method,
    payment_status
FROM payment
ORDER BY payment_id;

ALTER TABLE ticket
ADD (amount NUMBER(10,2) DEFAULT 0 NOT NULL);

SELECT column_name, data_type
FROM user_tab_columns
WHERE table_name IN ('TICKET', 'TRIP')
ORDER BY table_name, column_id;

SELECT table_name, column_name, data_type
FROM user_tab_columns
WHERE table_name IN ('TRIP', 'TICKET', 'PAYMENT')
ORDER BY table_name, column_id;

SELECT
    tk.ticket_id,
    tk.seat_no,
    tk.booking_status,
    tk.amount AS ticket_amount,
    t.fare AS trip_fare,
    p.name AS passenger_name
FROM ticket tk
JOIN trip t
    ON t.trip_id = tk.trip_id
JOIN passenger p
    ON p.passenger_id = tk.passenger_id
ORDER BY tk.ticket_id;

SELECT
    tk.ticket_id,
    tk.amount AS ticket_amount,
    p.payment_id,
    p.amount AS payment_amount,
    p.payment_status
FROM ticket tk
LEFT JOIN payment p
    ON p.ticket_id = tk.ticket_id
ORDER BY tk.ticket_id;

SELECT ticket_id, passenger_id, trip_id, booking_status
FROM ticket
WHERE passenger_id = 41
  AND trip_id = 21;
  
  SELECT table_name
FROM user_tables
ORDER BY table_name;


SELECT
    OWNER,
    TABLE_NAME,
    COLUMN_ID,
    COLUMN_NAME,
    DATA_TYPE,
    DATA_LENGTH,
    DATA_PRECISION,
    DATA_SCALE,
    NULLABLE
FROM ALL_TAB_COLUMNS
WHERE OWNER = 'SYSTEM'
  AND TABLE_NAME IN (
      'APP_USER',
      'DRIVER',
      'FEEDBACK',
      'MAINTENANCE',
      'PASSENGER',
      'PAYMENT',
      'ROUTE',
      'TICKET',
      'TRIP',
      'VEHICLE'
  )
ORDER BY TABLE_NAME, COLUMN_ID;
