

## Plan: Implement CSV Export for Admin Pest Reports

### What's happening now
The "Export CSV" button in `src/pages/PestReports.tsx` (line 62-65) is a static button with no `onClick` handler — it does nothing when clicked.

### Implementation

**Edit `src/pages/PestReports.tsx`:**

1. Add an `exportToCSV` function that:
   - Takes the current `filteredDetections` array
   - Builds CSV headers: `ID, Pest Type, Crop Type, Status, Confidence, Farmer Name, Farmer Email, Location, Latitude, Longitude, Farmer Notes, LGU Notes, Submitted At, Verified At`
   - Maps each detection row to comma-separated values (escaping commas/quotes in text fields)
   - Creates a Blob, generates a download URL, and triggers a file download
   - File named `pest-reports-YYYY-MM-DD.csv`

2. Wire the `onClick={exportToCSV}` to the existing Export CSV button

3. Show a toast notification on successful export

No backend changes needed — this is a pure client-side CSV generation from already-fetched data.

