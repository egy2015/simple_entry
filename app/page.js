'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown, Trash2, Eye, X } from 'lucide-react'

export default function DataDashboard() {
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [editFormData, setEditFormData] = useState({ entry: '', description: '' })
  const [showModal, setShowModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateData, setDuplicateData] = useState([])
  const [importingData, setImportingData] = useState([])
  const [duplicateActions, setDuplicateActions] = useState({})

  const itemsPerPage = 10

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('datasetItems')
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      setData(parsedData)
      setFilteredData(parsedData)
    }
  }, [])

  // Check for duplicates
  const findDuplicates = (newItems, existingItems) => {
    const duplicates = []
    const nonDuplicates = []

    newItems.forEach((newItem) => {
      const isDuplicate = existingItems.some(
        (existingItem) =>
          existingItem.entry.toLowerCase().trim() === newItem.entry.toLowerCase().trim()
      )

      if (isDuplicate) {
        duplicates.push(newItem)
      } else {
        nonDuplicates.push(newItem)
      }
    })

    return { duplicates, nonDuplicates }
  }

  // Handle file import
  const handleFileImport = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result)
        const itemsArray = Array.isArray(jsonData) ? jsonData : [jsonData]
        
        // Add IDs if not present
        const dataWithIds = itemsArray.map((item, index) => ({
          id: item.id || Date.now() + index,
          entry: item.entry || '',
          description: item.description || ''
        }))

        // Check for duplicates
        const { duplicates, nonDuplicates } = findDuplicates(dataWithIds, data)

        if (duplicates.length > 0) {
          // Show duplicate modal
          setDuplicateData(duplicates)
          setImportingData(dataWithIds)
          const initialActions = {}
          duplicates.forEach((item) => {
            initialActions[item.entry] = 'skip'
          })
          setDuplicateActions(initialActions)
          setShowDuplicateModal(true)
        } else {
          // No duplicates, proceed with import
          const mergedData = [...data, ...nonDuplicates]
          setData(mergedData)
          setFilteredData(mergedData)
          localStorage.setItem('datasetItems', JSON.stringify(mergedData))
          setCurrentPage(1)
        }
      } catch (error) {
        alert('Error parsing JSON file. Please check the file format.')
        console.error('Parse error:', error)
      }
    }
    reader.readAsText(file)
  }

  // Handle duplicate resolution
  const handleDuplicateResolution = () => {
    const itemsToKeep = []
    const itemsToOverwrite = []

    duplicateData.forEach((item) => {
      if (duplicateActions[item.entry] === 'overwrite') {
        itemsToOverwrite.push(item)
      }
    })

    // Get all non-duplicate items from import
    const { nonDuplicates } = findDuplicates(importingData, data)
    
    // Remove overwritten items from existing data and add new items
    let mergedData = data.filter(
      (item) => !itemsToOverwrite.some((toOverwrite) => toOverwrite.entry.toLowerCase().trim() === item.entry.toLowerCase().trim())
    )

    // Add non-duplicates and overwritten items
    mergedData = [...mergedData, ...nonDuplicates, ...itemsToOverwrite]

    setData(mergedData)
    setFilteredData(mergedData)
    localStorage.setItem('datasetItems', JSON.stringify(mergedData))
    setCurrentPage(1)
    setShowDuplicateModal(false)
    setDuplicateData([])
    setImportingData([])
    setDuplicateActions({})
  }

  // Handle search
  useEffect(() => {
    const filtered = data.filter(item =>
      item.entry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredData(filtered)
    setCurrentPage(1)
  }, [searchTerm, data])

  // Handle sort
  const handleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    setSortOrder(newOrder)
    
    const sorted = [...filteredData].sort((a, b) => {
      if (newOrder === 'asc') {
        return a.entry.localeCompare(b.entry)
      } else {
        return b.entry.localeCompare(a.entry)
      }
    })
    setFilteredData(sorted)
  }

  // Get paginated data
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  // Handle view
  const handleView = (item) => {
    setSelectedItem(item)
    setEditFormData({ entry: item.entry, description: item.description })
    setIsEditMode(false)
    setShowModal(true)
  }

  // Handle edit
  const handleEditClick = () => {
    setIsEditMode(true)
  }

  // Handle save
  const handleSave = () => {
    if (!editFormData.entry.trim() || !editFormData.description.trim()) {
      alert('Please fill in all fields')
      return
    }

    const updatedData = data.map(item =>
      item.id === selectedItem.id
        ? { ...item, entry: editFormData.entry, description: editFormData.description }
        : item
    )

    setData(updatedData)
    setFilteredData(updatedData.filter(item =>
      item.entry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    ))
    localStorage.setItem('datasetItems', JSON.stringify(updatedData))
    setShowModal(false)
    setIsEditMode(false)
    setSelectedItem(null)
  }

  // Handle delete
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const updatedData = data.filter(item => item.id !== id)
      setData(updatedData)
      setFilteredData(updatedData.filter(item =>
        item.entry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      ))
      localStorage.setItem('datasetItems', JSON.stringify(updatedData))
      if (paginatedData.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    }
  }

  // Handle back
  const handleBack = () => {
    setShowModal(false)
    setIsEditMode(false)
    setSelectedItem(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Data Management</h1>
          <p className="text-slate-600">Import, search, and manage your dataset efficiently</p>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Import Button */}
            <label className="flex-1 sm:flex-initial">
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
                aria-label="Import dataset JSON file"
              />
              <button
                onClick={(e) => e.currentTarget.parentElement.querySelector('input').click()}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md active:scale-95"
              >
                📁 Import Dataset
              </button>
            </label>

            {/* Search Input */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by entry or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-label="Search dataset"
              />
            </div>

            {/* Results Count */}
            <div className="text-sm font-medium text-slate-600 px-4 py-2">
              {filteredData.length} result{filteredData.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Table Section */}
        {filteredData.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Table - Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={handleSort}
                        className="flex items-center gap-2 font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                        title="Click to sort"
                      >
                        Entry
                        {sortOrder === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-900">Description</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">{item.entry}</td>
                      <td className="px-6 py-4 text-slate-600">{item.description}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={() => handleView(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View details"
                            aria-label={`View ${item.entry}`}
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete item"
                            aria-label={`Delete ${item.entry}`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table - Mobile */}
            <div className="md:hidden divide-y divide-slate-200">
              {paginatedData.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="mb-3">
                    <button
                      onClick={handleSort}
                      className="flex items-center gap-2 font-semibold text-slate-900 text-sm hover:text-blue-600 w-full"
                    >
                      {item.entry}
                      {sortOrder === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-slate-600 text-sm mb-3">{item.description}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(item)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-600 order-2 sm:order-1">
                  Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length}
                </div>
                <div className="flex gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-slate-600 text-lg mb-4">No data imported yet</p>
            <p className="text-slate-500">Click the "Import Dataset" button above to load your JSON file</p>
          </div>
        )}
      </div>

      {/* Duplicate Detection Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Duplicate Entries Found
              </h2>
              <button
                onClick={() => {
                  setShowDuplicateModal(false)
                  setDuplicateData([])
                  setImportingData([])
                  setDuplicateActions({})
                }}
                className="text-white hover:bg-amber-500 p-1 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-slate-700 mb-4">
                We found {duplicateData.length} entry{duplicateData.length !== 1 ? 'ies' : ''} that already exist in your dataset. Choose whether to skip or overwrite each one:
              </p>

              {/* Duplicates List */}
              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {duplicateData.map((item, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                    <div className="mb-3">
                      <p className="font-semibold text-slate-900">{item.entry}</p>
                      <p className="text-sm text-slate-600">{item.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setDuplicateActions({
                            ...duplicateActions,
                            [item.entry]: 'skip'
                          })
                        }
                        className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                          duplicateActions[item.entry] === 'skip'
                            ? 'bg-slate-500 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        Skip
                      </button>
                      <button
                        onClick={() =>
                          setDuplicateActions({
                            ...duplicateActions,
                            [item.entry]: 'overwrite'
                          })
                        }
                        className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                          duplicateActions[item.entry] === 'overwrite'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        Overwrite
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowDuplicateModal(false)
                    setDuplicateData([])
                    setImportingData([])
                    setDuplicateActions({})
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDuplicateResolution}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors active:scale-95"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {isEditMode ? 'Edit Entry' : 'View Entry'}
              </h2>
              <button
                onClick={handleBack}
                className="text-white hover:bg-blue-500 p-1 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Entry
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editFormData.entry}
                    onChange={(e) => setEditFormData({ ...editFormData, entry: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter title"
                  />
                ) : (
                  <p className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-900">{selectedItem.entry}</p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Description
                </label>
                {isEditMode ? (
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    rows="4"
                    placeholder="Enter description"
                  />
                ) : (
                  <p className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">{selectedItem.description}</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={handleBack}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                {isEditMode ? (
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors active:scale-95"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={handleEditClick}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors active:scale-95"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
