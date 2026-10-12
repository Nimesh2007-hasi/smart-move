
"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { generateProcedurePdf } from "@/lib/pdfReports";

type Summary = {
  TOTAL_TRIPS: number;
  TOTAL_PASSENGERS: number;
  TOTAL_BOOKINGS: number;
  TOTAL_REVENUE: number;
  MAINTENANCE_COST: number;
};

type RouteRow = {
  ORIGIN: string;
  DESTINATION: string;
  TRIP_COUNT: number;
  PASSENGER_COUNT: number;
};

type RevenueRow = {
  PAYMENT_DATE: string;
  PAYMENT_COUNT: number;
  REVENUE: number;
};

type DriverRow = {
  DRIVER_ID: number;
  DRIVER_NAME: string;
  STATUS: string;
  TRIP_COUNT: number;
  PASSENGER_COUNT: number;
};

type MaintenanceRow = {
  MAINTENANCE_ID: number;
  REG_NUMBER: string;
  SERVICE_DATE: string;
  DESCRIPTION: string | null;
  COST: number;
};

type ReportData = {
  summary: Summary;
  routes: RouteRow[];
  revenue: RevenueRow[];
  drivers: DriverRow[];
  maintenance: MaintenanceRow[];
};

type ProcedureReport = {
  lines: string[];
  error?: string;
};

type ReportCard = {
  title: string;
  description: string;
  fileName: string;
  url: string;
};

const labelClass = "text-sm text-[#7a869a]";

const individualReports: ReportCard[] = [
  {
    title: "Popular Routes",
    description:
      "Identify frequently booked routes and understand transport demand.",
    fileName: "Popular-Routes-Report.pdf",
    url: "/api/reports/popular-routes",
  },
  {
    title: "Revenue Report",
    description:
      "Review revenue and successful payment details from Oracle.",
    fileName: "Revenue-Report.pdf",
    url: "/api/reports/revenue",
  },
  {
    title: "Passenger Travel History",
    description:
      "Generate a report of passenger journeys and travel activity.",
    fileName: "Passenger-Travel-Report.pdf",
    url: "/api/reports/all-passenger-trips",
  },
  {
    title: "Maintenance Attention",
    description:
      "Identify vehicles that require maintenance attention.",
    fileName: "Maintenance-Attention-Report.pdf",
    url: "/api/reports/maintenance-attention",
  },
  {
    title: "Driver Performance",
    description:
      "Review driver activity and trip performance.",
    fileName: "Driver-Performance-Report.pdf",
    url: "/api/reports/driver-performance",
  },
];

async function readJson(response: Response) {
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || result.message || "The request failed."
    );
  }

  return result;
}

function number(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-US");
}

function currency(value: unknown) {
  return `LKR ${number(value)}`;
}

function badgeClass(status: string) {
  if (status === "ACTIVE") {
    return "neu-badge neu-badge-active";
  }

  if (status === "ON_LEAVE" || status === "MAINTENANCE") {
    return "neu-badge neu-badge-maintenance";
  }

  return "neu-badge neu-badge-inactive";
}

function TableEmpty({
  columns,
  message,
}: {
  columns: number;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={columns} className="px-6 py-6 text-center text-[#7a869a]">
        {message}
      </td>
    </tr>
  );
}

function ReportTableSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="neu-flat mt-8 overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-[#44506a]">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-[#7a869a]">{description}</p>
        )}
      </div>

      <div className="overflow-x-auto px-6 pb-6">
        <div className="neu-pressed overflow-hidden">
          <table className="neu-table w-full">
            {children}
          </table>
        </div>
      </div>
    </section>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingReport, setGeneratingReport] = useState<string | null>(
    null
  );

  const [revenueStartDate, setRevenueStartDate] = useState("");
  const [revenueEndDate, setRevenueEndDate] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/reports", {
        cache: "no-store",
      });
      const result = await readJson(response);
      setData(result as ReportData);
    } catch (err) {
      setData(null);
      setError(
        err instanceof Error
          ? err.message
          : "Could not load reports from Oracle."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  async function generateIndividualReport(report: ReportCard) {
    setGeneratingReport(report.fileName);
    setError("");

    try {
      let url = report.url;

      if (report.title === "Revenue Report") {
        if (revenueStartDate && !revenueEndDate) {
          throw new Error("Please select an end date.");
        }

        if (!revenueStartDate && revenueEndDate) {
          throw new Error("Please select a start date.");
        }

        if (
          revenueStartDate &&
          revenueEndDate &&
          revenueStartDate > revenueEndDate
        ) {
          throw new Error("The start date must be before the end date.");
        }

        if (revenueStartDate && revenueEndDate) {
          const params = new URLSearchParams({
            startDate: revenueStartDate,
            endDate: revenueEndDate,
          });

          url = `${report.url}?${params.toString()}`;
        }
      }

      const response = await fetch(url, { cache: "no-store" });
      const result = await readJson(response);

      if (!Array.isArray(result.lines)) {
        throw new Error("The report endpoint did not return report lines.");
      }

      generateProcedurePdf({
        title: report.title,
        fileName: report.fileName,
        lines: result.lines,
        startDate: result.startDate,
        endDate: result.endDate,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not generate ${report.title}: ${err.message}`
          : `Could not generate ${report.title}.`
      );
    } finally {
      setGeneratingReport(null);
    }
  }

  function exportSummaryPdf() {
    if (!data) return;

    setError("");
    setGeneratingReport("summary");

    try {
      generateProcedurePdf({
        title: "Business and Operational Summary",
        fileName: "Smart-Move-Business-Summary.pdf",
        lines: [
          "BUSINESS OVERVIEW",
          `Total trips: ${number(data.summary.TOTAL_TRIPS)}`,
          `Total passengers: ${number(data.summary.TOTAL_PASSENGERS)}`,
          `Total bookings: ${number(data.summary.TOTAL_BOOKINGS)}`,
          `Paid revenue: ${currency(data.summary.TOTAL_REVENUE)}`,
          `Maintenance cost: ${currency(data.summary.MAINTENANCE_COST)}`,
          "",
          "ROUTE USAGE",
          ...data.routes.map(
            (route) =>
              `${route.ORIGIN} -> ${route.DESTINATION} | Trips: ${number(
                route.TRIP_COUNT
              )} | Non-cancelled tickets: ${number(route.PASSENGER_COUNT)}`
          ),
          "",
          "REVENUE SUMMARY",
          ...data.revenue.map(
            (row) =>
              `${row.PAYMENT_DATE} | Payment records: ${number(
                row.PAYMENT_COUNT
              )} | Paid revenue: ${currency(row.REVENUE)}`
          ),
          "",
          "DRIVER SUMMARY",
          ...data.drivers.map(
            (driver) =>
              `${driver.DRIVER_NAME} | Status: ${driver.STATUS} | Trips: ${number(
                driver.TRIP_COUNT
              )} | Non-cancelled tickets: ${number(driver.PASSENGER_COUNT)}`
          ),
          "",
          "VEHICLE MAINTENANCE",
          ...data.maintenance.map(
            (row) =>
              `${row.REG_NUMBER} | ${row.SERVICE_DATE || "No date"} | ${
                row.DESCRIPTION || "No description"
              } | Cost: ${currency(row.COST)}`
          ),
        ],
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? `PDF export failed: ${err.message}`
          : "PDF export failed."
      );
    } finally {
      setGeneratingReport(null);
    }
  }

  const summary = data?.summary;

  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="ml-64">
        <Header />

        <main className="p-8">
          {/* Page heading */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#44506a]">
                Reports Centre
              </h1>
              <p className="mt-2 text-[#7a869a]">
                Business insights and individual PDF reports generated from
                Oracle Database.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void loadReports()}
                disabled={loading}
                className="neu-btn px-5 py-3 disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh Data"}
              </button>

              <button
                onClick={exportSummaryPdf}
                disabled={!data || loading || generatingReport !== null}
                className="neu-btn px-5 py-3 text-indigo-600 disabled:opacity-50"
              >
                {generatingReport === "summary"
                  ? "Generating..."
                  : "Export Summary PDF"}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="neu-flat mt-6 break-words p-4 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {loading && (
            <div className="neu-flat mt-8 p-6 text-[#7a869a]">
              Loading business reports from Oracle Database...
            </div>
          )}

          {/* Dashboard summary */}
          {data && (
            <>
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  {
                    title: "Total Trips",
                    value: number(summary?.TOTAL_TRIPS),
                    icon: "↗",
                  },
                  {
                    title: "Passengers",
                    value: number(summary?.TOTAL_PASSENGERS),
                    icon: "♙",
                  },
                  {
                    title: "Bookings",
                    value: number(summary?.TOTAL_BOOKINGS),
                    icon: "▤",
                  },
                  {
                    title: "Paid Revenue",
                    value: currency(summary?.TOTAL_REVENUE),
                    icon: "₨",
                  },
                  {
                    title: "Maintenance Cost",
                    value: currency(summary?.MAINTENANCE_COST),
                    icon: "⚙",
                  },
                ].map((item) => (
                  <div key={item.title} className="neu-flat p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className={labelClass}>{item.title}</p>
                      <span className="text-xl text-indigo-600">
                        {item.icon}
                      </span>
                    </div>

                    <div className="neu-pressed mt-4 px-3 py-4">
                      <p className="break-words text-2xl font-bold text-indigo-600">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Individual PDF reports */}
              <section className="mt-10">
                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-[#44506a]">
                    Generate Individual Reports
                  </h2>
                  <p className="mt-2 text-sm text-[#7a869a]">
                    Generate and download each operational report separately.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {individualReports.map((report, index) => (
                    <div
                      key={report.fileName}
                      className="neu-flat flex flex-col p-6"
                    >
                      <div className="neu-pressed mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
                        <span className="text-sm font-bold text-indigo-600">
                          PDF {index + 1}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-[#44506a]">
                        {report.title}
                      </h3>

                      <p className="mt-2 flex-1 text-sm leading-6 text-[#7a869a]">
                        {report.description}
                      </p>

                      {report.title === "Revenue Report" && (
                        <div className="mt-4 space-y-3">
                          <label className="block text-sm text-[#7a869a]">
                            Start date (optional)
                            <input
                              type="date"
                              value={revenueStartDate}
                              onChange={(event) =>
                                setRevenueStartDate(event.target.value)
                              }
                              className="neu-input mt-2 w-full px-3 py-3"
                            />
                          </label>

                          <label className="block text-sm text-[#7a869a]">
                            End date (optional)
                            <input
                              type="date"
                              value={revenueEndDate}
                              onChange={(event) =>
                                setRevenueEndDate(event.target.value)
                              }
                              className="neu-input mt-2 w-full px-3 py-3"
                            />
                          </label>

                          <p className="text-xs leading-5 text-[#7a869a]">
                            Leave both dates empty to use the API's default
                            reporting period.
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => void generateIndividualReport(report)}
                        disabled={generatingReport !== null}
                        className="neu-btn mt-6 w-full px-4 py-3 text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {generatingReport === report.fileName
                          ? "Generating PDF..."
                          : "Generate PDF"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Route usage */}
              <ReportTableSection
                title="Route Usage"
                description="Trips and non-cancelled tickets grouped by route."
              >
                <thead>
                  <tr className="text-left text-sm text-[#7a869a]">
                    {["Route", "Number of Trips", "Non-cancelled Tickets"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-6 py-4 font-semibold"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.routes.map((route, index) => (
                    <tr key={`${route.ORIGIN}-${route.DESTINATION}-${index}`}>
                      <td className="px-6 py-4 font-medium">
                        {route.ORIGIN} - {route.DESTINATION}
                      </td>
                      <td className="px-6 py-4">
                        {number(route.TRIP_COUNT)}
                      </td>
                      <td className="px-6 py-4">
                        {number(route.PASSENGER_COUNT)}
                      </td>
                    </tr>
                  ))}
                  {data.routes.length === 0 && (
                    <TableEmpty columns={3} message="No route data available." />
                  )}
                </tbody>
              </ReportTableSection>

              {/* Revenue summary */}
              <ReportTableSection
                title="Revenue Summary"
                description="Revenue from PAID transactions only."
              >
                <thead>
                  <tr className="text-left text-sm text-[#7a869a]">
                    {["Payment Date", "Payment Records", "Paid Revenue"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-6 py-4 font-semibold"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.revenue.map((row, index) => (
                    <tr key={`${row.PAYMENT_DATE}-${index}`}>
                      <td className="px-6 py-4">
                        {row.PAYMENT_DATE || "—"}
                      </td>
                      <td className="px-6 py-4">
                        {number(row.PAYMENT_COUNT)}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {currency(row.REVENUE)}
                      </td>
                    </tr>
                  ))}
                  {data.revenue.length === 0 && (
                    <TableEmpty
                      columns={3}
                      message="No payment data available."
                    />
                  )}
                </tbody>
              </ReportTableSection>

              {/* Driver summary */}
              <ReportTableSection
                title="Driver Summary"
                description="Trip activity and non-cancelled ticket totals by driver."
              >
                <thead>
                  <tr className="text-left text-sm text-[#7a869a]">
                    {[
                      "Driver",
                      "Trips",
                      "Non-cancelled Tickets",
                      "Status",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-6 py-4 font-semibold"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.drivers.map((driver) => (
                    <tr key={driver.DRIVER_ID}>
                      <td className="px-6 py-4 font-medium">
                        {driver.DRIVER_NAME}
                      </td>
                      <td className="px-6 py-4">
                        {number(driver.TRIP_COUNT)}
                      </td>
                      <td className="px-6 py-4">
                        {number(driver.PASSENGER_COUNT)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={badgeClass(driver.STATUS)}>
                          {driver.STATUS}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {data.drivers.length === 0 && (
                    <TableEmpty
                      columns={4}
                      message="No driver data available."
                    />
                  )}
                </tbody>
              </ReportTableSection>

              {/* Maintenance summary */}
              <ReportTableSection
                title="Vehicle Maintenance Summary"
                description="Recorded maintenance services and costs."
              >
                <thead>
                  <tr className="text-left text-sm text-[#7a869a]">
                    {["Vehicle", "Service Date", "Description", "Cost"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-6 py-4 font-semibold"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.maintenance.map((row) => (
                    <tr key={row.MAINTENANCE_ID}>
                      <td className="px-6 py-4 font-medium">
                        {row.REG_NUMBER}
                      </td>
                      <td className="px-6 py-4">
                        {row.SERVICE_DATE || "—"}
                      </td>
                      <td className="max-w-sm whitespace-normal px-6 py-4">
                        {row.DESCRIPTION || "—"}
                      </td>
                      <td className="px-6 py-4">{currency(row.COST)}</td>
                    </tr>
                  ))}
                  {data.maintenance.length === 0 && (
                    <TableEmpty
                      columns={4}
                      message="No maintenance records available."
                    />
                  )}
                </tbody>
              </ReportTableSection>
            </>
          )}
        </main>
      </div>
    </div>
  );
}