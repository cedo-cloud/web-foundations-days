let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

function searchNotes(word) {
  const lowerCaseWord = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(lowerCaseWord));
}

function longestNote() {
  if (notes.length === 0) return null;
  
  let longest = notes[0];
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }
  return longest;
}

function countByCategory() {
  const counts = {};
  for (let i = 0; i < notes.length; i++) {
    const category = notes[i].category;
    if (counts[category]) {
      counts[category]++;
    } else {
      counts[category] = 1;
    }
  }
  return counts;
}

function getSummary() {
  const totalNotes = notes.length;
  const noteLabel = totalNotes === 1 ? "note" : "notes";
  const counts = countByCategory();
  
  const categoryStrings = [];
  for (const [category, count] of Object.entries(counts)) {
    categoryStrings.push(`${count} ${category}`);
  }
  
  return `${totalNotes} ${noteLabel}: ${categoryStrings.join(", ")}.`;
}

function isDuplicate(text) {
  const normalizedText = text.trim().toLowerCase();
  return notes.some(note => note.text.trim().toLowerCase() === normalizedText);
}

function addNote(text, category) {
  const validCategories = ["personal", "work", "study"];
  
  if (text.length < 1 || text.length > 200) {
    console.log("Failed to add note: Text must be between 1 and 200 characters.");
    return false;
  }
  
  if (!validCategories.includes(category)) {
    console.log("Failed to add note: Category must be 'personal', 'work', or 'study'.");
    return false;
  }
  
  if (isDuplicate(text)) {
    console.log("Failed to add note: A note with this text already exists.");
    return false;
  }
  
  const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  notes.push({ id: newId, text: text, category: category });
  return true;
}


// --- TESTS ---

// searchNotes
console.log(searchNotes("javaScript")); 
console.log(searchNotes("XYZ")); 

// longestNote
console.log(longestNote()); 
const tempNotes = [...notes];
notes = [];
console.log(longestNote()); 
notes = [...tempNotes]; 

// countByCategory
console.log(countByCategory()); 
notes.push({ id: 6, text: "Test note", category: "personal" });
console.log(countByCategory());
notes.pop(); // Restore array

// getSummary
console.log(getSummary());
notes = [{ id: 1, text: "Single item", category: "work" }];
console.log(getSummary()); 
notes = [...tempNotes]; 

// isDuplicate
console.log(isDuplicate("  CALL mum ")); 
console.log(isDuplicate("Buy eggs")); 

// addNote
console.log(addNote("Review Vue 3", "study")); 
console.log(addNote("Call mum", "personal")); 
console.log(addNote("", "work")); 