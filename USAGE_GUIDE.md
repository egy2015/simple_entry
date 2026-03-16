# Data Management Dashboard - Usage Guide

## Overview
This is a modern, responsive data management dashboard built with pure JavaScript. It allows you to import JSON datasets, search through them, sort entries, and manage your data with an intuitive interface.

## Features

### 1. Import Dataset
- Click the **"📁 Import Dataset"** button
- Select a JSON file from your computer
- The JSON file should be an array of objects with `entry` and `description` fields

### 2. Search
- Use the search input to filter data in real-time
- Searches both the Entry and Description fields
- Results update instantly as you type

### 3. Sort Entries
- Click the **"Entry"** column header to sort
- Toggle between ascending (↑) and descending (↓) order
- Sorting works on the filtered data

### 4. Pagination
- View up to 10 items per page
- Use the "Previous" and "Next" buttons to navigate
- Current page and total results are displayed

### 5. View & Edit
- Click the **👁 (Eye)** icon to view item details in a modal
- In the modal, click **Edit** to modify the entry or description
- Click **Save** to confirm changes
- Click **Back** to close without saving

### 6. Delete
- Click the **🗑️ (Trash)** icon to delete an item
- A confirmation dialog will appear before deletion
- Deleted items are permanently removed from the dataset

## JSON Format

Your dataset.json should follow this structure:

```json
[
  {
    "id": 1,
    "entry": "Title or Name",
    "description": "Detailed description of this entry"
  },
  {
    "id": 2,
    "entry": "Another Entry",
    "description": "Another description"
  }
]
```

## Data Persistence

All changes (imports, edits, deletions) are automatically saved to your browser's localStorage. Your data will persist even after closing and reopening the browser.

## Responsive Design

- **Desktop**: Full table view with hover effects
- **Tablet**: Optimized layout with touch-friendly buttons
- **Mobile**: Card-based view for easy scrolling and interaction

## Browser Support

Works on all modern browsers that support:
- JavaScript ES6+
- Fetch API
- localStorage

## Tips

- Import the provided sample dataset to explore all features
- Use the sample dataset to understand the JSON structure
- All data is stored locally in your browser - nothing is sent to servers
- You can export your data by copying it from browser DevTools
