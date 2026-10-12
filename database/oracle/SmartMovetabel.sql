-- 1. VEHICLE
CREATE TABLE vehicle (
    vehicle_id   NUMBER GENERATED ALWAYS AS IDENTITY,
    reg_number   VARCHAR2(20)  NOT NULL,
    status       VARCHAR2(20)  DEFAULT 'ACTIVE' NOT NULL,
    type         VARCHAR2(30)  NOT NULL,
    capacity     NUMBER(3)     NOT NULL,
    CONSTRAINT pk_vehicle PRIMARY KEY (vehicle_id),
    CONSTRAINT uq_vehicle_reg UNIQUE (reg_number),
    CONSTRAINT ck_vehicle_status CHECK (status IN ('ACTIVE','INACTIVE','MAINTENANCE')),
    CONSTRAINT ck_vehicle_capacity CHECK (capacity > 0)
);

-- 2. DRIVER
CREATE TABLE driver (
    driver_id    NUMBER GENERATED ALWAYS AS IDENTITY,
    name         VARCHAR2(100) NOT NULL,
    license_no   VARCHAR2(30)  NOT NULL,
    contact      VARCHAR2(20),
    status       VARCHAR2(20)  DEFAULT 'ACTIVE' NOT NULL,
    CONSTRAINT pk_driver PRIMARY KEY (driver_id),
    CONSTRAINT uq_driver_license UNIQUE (license_no),
    CONSTRAINT ck_driver_status CHECK (status IN ('ACTIVE','INACTIVE','ON_LEAVE'))
);

-- 3. ROUTE
CREATE TABLE route (
    route_id     NUMBER GENERATED ALWAYS AS IDENTITY,
    origin       VARCHAR2(100) NOT NULL,
    destination  VARCHAR2(100) NOT NULL,
    distance_km  NUMBER(8,2)   NOT NULL,
    CONSTRAINT pk_route PRIMARY KEY (route_id),
    CONSTRAINT ck_route_distance CHECK (distance_km > 0)
);

-- 4. PASSENGER
CREATE TABLE passenger (
    passenger_id NUMBER GENERATED ALWAYS AS IDENTITY,
    name         VARCHAR2(100) NOT NULL,
    email        VARCHAR2(150),
    contact      VARCHAR2(20),
    CONSTRAINT pk_passenger PRIMARY KEY (passenger_id),
    CONSTRAINT uq_passenger_email UNIQUE (email)
);

-- 5. MAINTENANCE
CREATE TABLE maintenance (
    maintenance_id NUMBER GENERATED ALWAYS AS IDENTITY,
    cost           NUMBER(10,2) NOT NULL,
    description    VARCHAR2(500),
    service_date   DATE         NOT NULL,
    vehicle_id     NUMBER       NOT NULL,
    CONSTRAINT pk_maintenance PRIMARY KEY (maintenance_id),
    CONSTRAINT fk_maint_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id),
    CONSTRAINT ck_maint_cost CHECK (cost >= 0)
);

-- 6. TRIP
CREATE TABLE trip (
    trip_id        NUMBER GENERATED ALWAYS AS IDENTITY,
    vehicle_id     NUMBER      NOT NULL,
    driver_id      NUMBER      NOT NULL,
    route_id       NUMBER      NOT NULL,
    departure_time TIMESTAMP   NOT NULL,
    arrival_time   TIMESTAMP,
    status         VARCHAR2(20) DEFAULT 'SCHEDULED' NOT NULL,
    CONSTRAINT pk_trip PRIMARY KEY (trip_id),
    CONSTRAINT fk_trip_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id),
    CONSTRAINT fk_trip_driver  FOREIGN KEY (driver_id)  REFERENCES driver(driver_id),
    CONSTRAINT fk_trip_route   FOREIGN KEY (route_id)   REFERENCES route(route_id),
    CONSTRAINT ck_trip_status CHECK (status IN ('SCHEDULED','ONGOING','COMPLETED','CANCELLED')),
    CONSTRAINT ck_trip_times CHECK (arrival_time IS NULL OR arrival_time > departure_time)
);

-- 7. TICKET
CREATE TABLE ticket (
    ticket_id      NUMBER GENERATED ALWAYS AS IDENTITY,
    seat_no        VARCHAR2(10) NOT NULL,
    booking_status VARCHAR2(20) DEFAULT 'BOOKED' NOT NULL,
    trip_id        NUMBER       NOT NULL,
    passenger_id   NUMBER       NOT NULL,
    CONSTRAINT pk_ticket PRIMARY KEY (ticket_id),
    CONSTRAINT fk_ticket_trip      FOREIGN KEY (trip_id)      REFERENCES trip(trip_id),
    CONSTRAINT fk_ticket_passenger FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id),
    CONSTRAINT ck_ticket_status CHECK (booking_status IN ('BOOKED','CONFIRMED','CANCELLED'))
);

-- 8. PAYMENT
CREATE TABLE payment (
    payment_id     NUMBER GENERATED ALWAYS AS IDENTITY,
    amount         NUMBER(10,2) NOT NULL,
    method         VARCHAR2(20) NOT NULL,
    payment_status VARCHAR2(20) DEFAULT 'PENDING' NOT NULL,
    payment_date   DATE         DEFAULT SYSDATE,
    ticket_id      NUMBER       NOT NULL,
    CONSTRAINT pk_payment PRIMARY KEY (payment_id),
    CONSTRAINT fk_payment_ticket FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id),
    CONSTRAINT ck_payment_amount CHECK (amount > 0),
    CONSTRAINT ck_payment_method CHECK (method IN ('CASH','CARD','ONLINE','WALLET')),
    CONSTRAINT ck_payment_status CHECK (payment_status IN ('PENDING','PAID','FAILED','REFUNDED'))
);

-- 9. FEEDBACK
CREATE TABLE feedback (
    feedback_id  NUMBER GENERATED ALWAYS AS IDENTITY,
    rating       NUMBER(1)     NOT NULL,
    comments     VARCHAR2(1000),
    passenger_id NUMBER        NOT NULL,
    trip_id      NUMBER        NOT NULL,
    CONSTRAINT pk_feedback PRIMARY KEY (feedback_id),
    CONSTRAINT fk_feedback_passenger FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id),
    CONSTRAINT fk_feedback_trip      FOREIGN KEY (trip_id)      REFERENCES trip(trip_id),
    CONSTRAINT ck_feedback_rating CHECK (rating BETWEEN 1 AND 5)
);
