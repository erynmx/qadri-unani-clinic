nodeQadri Unani Clinic Website & API
Directory Structure
Ensure your project looks exactly like this:
qadri-unani-clinic/
├── frontend/
│ ├── index.html
│ └── assets/
│ └── doctor.jpg
├── backend/
│ ├── models/
│ │ └── Appointment.js
│ ├── .env
│ ├── package.json
│ └── server.js
└── README.md
Backend Setup (Node.js & MongoDB)
1. Open your terminal and navigate to the backend folder: cd backend
2. Install the required Node dependencies: npm install
3. Rename .env.example to .env .
4. Inside .env , replace the MONGODB_URI string with your actual MongoDB connection string.
5. Start the server: npm run dev (It will run on http://localhost:5000 )
Frontend Setup
1. Inside the frontend folder, place your real doctor photograph inside the assets folder and
name it doctor.jpg . (Update the src paths in index.html if your file name is different).
2. Simply open index.html in your web browser.
Testing the Application
Submitting an Appointment: Fill out the form in your browser. It will hit the POST
http://localhost:5000/api/appointments route and save to your MongoDB database.
Admin Dashboard: Scroll to the footer of the website and click Admin Login. Enter the secret
token defined in your .env file (default: admin123 ). This will call the GET route to fetch all
appointments from the database, allowing you to edit or delete them