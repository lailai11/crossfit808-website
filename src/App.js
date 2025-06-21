/* global __app_id, __initial_auth_token */

import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, orderBy, where, serverTimestamp, Timestamp } from 'firebase/firestore';

// Lucide React for icons
import { Menu, X, Instagram, Facebook, Mail, Phone, MapPin, Calendar, Clock, User, Award, Plus, Edit, Trash2, LogOut, Loader2, Dumbbell, ShoppingCart, LayoutList } from 'lucide-react';

// Global variables provided by the Canvas environment for Firebase setup
// Note: __app_id and __initial_auth_token are specific to the Canvas environment.
// For local development, appId will default to 'default-crossfit-app' and initialAuthToken to null.
// The errors about them being 'not defined' are ESLint warnings and do not prevent compilation or runtime,
// as the code gracefully handles their absence by checking 'typeof'.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-crossfit-app';
const firebaseConfig = { // This entire object should contain your actual Firebase config.
  apiKey: "AIzaSyAwq2gM_TKtW_aMY_VImQ_GMt5GTWCYET0", // Replace with your actual API Key
  authDomain: "crossfit808-website.firebaseapp.com", // Replace with your actual Auth Domain
  projectId: "crossfit808-website", // Replace with your actual Project ID
  storageBucket: "crossfit808-website.firebasestorage.app", // Replace with your actual Storage Bucket
  messagingSenderId: "472665220932", // Replace with your actual Messaging Sender ID
  appId: "1:472665220932:web:5cb4ca6cbeaf196b171911", // Replace with your actual App ID
  measurementId: "G-H2PN68D6S5" // Replace with your actual Measurement ID (if you enabled Google Analytics)
};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase outside the component to avoid re-initialization
let app, db, auth;
if (Object.keys(firebaseConfig).length > 0) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
}

// Reusable Button Component
const Button = ({ children, onClick, className = '', primary = true, icon: Icon = null, ...props }) => (
    <button
        onClick={onClick}
        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105
            ${primary ? 'bg-sky-500 text-white shadow-lg hover:bg-sky-600' : 'bg-gray-700 text-gray-200 shadow-md hover:bg-gray-800'}
            flex items-center justify-center gap-2
            ${className}`}
        {...props}
    >
        {Icon && <Icon size={20} />}
        {children}
    </button>
);

// Section Wrapper Component
const Section = ({ id, title, children, className = '', centerTitle = true }) => (
    <section id={id} className={`py-16 md:py-24 ${className}`}>
        <div className="container mx-auto px-4">
            {title && (
                <h2 className={`text-4xl md:text-5xl font-extrabold text-white mb-12 relative pb-4
                                ${centerTitle ? 'text-center' : 'text-left'}
                                after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-20 after:h-1.5 after:bg-sky-500 after:rounded-full
                                ${!centerTitle && 'after:left-0 after:translate-x-0'}`}>
                    {title}
                </h2>
            )}
            {children}
        </div>
    </section>
);

// Custom Modal Component (replaces alert/confirm)
const Modal = ({ isOpen, title, message, onConfirm, onCancel, showCancel = true, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl p-8 max-w-lg w-full shadow-2xl border border-gray-700">
                <h3 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-3">{title}</h3>
                <p className="text-gray-300 mb-6">{message}</p>
                {children}
                <div className="flex justify-end gap-4 mt-6">
                    {showCancel && (
                        <Button primary={false} onClick={onCancel} className="bg-gray-600 hover:bg-gray-700">Cancel</Button>
                    )}
                    <Button onClick={onConfirm} className="bg-sky-500 hover:bg-sky-600">Confirm</Button>
                </div>
            </div>
        </div>
    );
};


function App() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [dbInstance, setDbInstance] = useState(null);
    const [authInstance, setAuthInstance] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Renamed to avoid conflict

    // Initialize Firebase and set up auth listener
    useEffect(() => {
        const initializeFirebase = async () => {
            if (app && db && auth) {
                setDbInstance(db);
                setAuthInstance(auth);

                // Sign in with custom token if available, otherwise anonymously
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                        console.log("Signed in with custom token.");
                    } else {
                        await signInAnonymously(auth);
                        console.log("Signed in anonymously.");
                    }
                } catch (error) {
                    console.error("Firebase authentication error:", error);
                }

                // Listen for auth state changes
                const unsubscribe = onAuthStateChanged(auth, (user) => {
                    setCurrentUser(user);
                    setUserId(user?.uid || crypto.randomUUID()); // Use UID or a random ID if not authenticated
                    setIsAuthReady(true); // Auth state has been checked
                    setIsLoadingAuth(false); // Finished loading auth state
                });

                return () => unsubscribe();
            } else {
                console.error("Firebase not initialized. Check firebaseConfig.");
                setIsLoadingAuth(false); // Stop loading if Firebase isn't configured
            }
        };

        initializeFirebase();
    }, []); // Run only once on mount


    // Navigation Item Component
    const NavItem = ({ to, children }) => (
        <a
            href={`#${to}`}
            className="block py-2 px-4 text-gray-300 hover:text-white hover:bg-sky-500 rounded-lg transition duration-300 md:inline-block md:px-0 md:py-0 md:hover:bg-transparent"
            onClick={() => setIsMenuOpen(false)}
        >
            {children}
        </a>
    );

    // Header component
    const Header = () => (
        <header className="bg-gray-900 bg-opacity-95 shadow-lg fixed w-full z-40 top-0">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <a href="#home" className="text-white text-3xl font-extrabold flex items-center gap-2">
                    <img src="https://placehold.co/40x40/87CEEB/ffffff?text=808" alt="CrossFit 808 Logo" className="rounded-full" />
                    CrossFit <span className="text-sky-500">808</span>
                </a>
                
                <nav className="hidden md:block">
                    <ul className="flex space-x-6 text-lg font-medium">
                        <li><NavItem to="home">Home</NavItem></li>
                        <li><NavItem to="about">About</NavItem></li>
                        <li><NavItem to="programs">Programs</NavItem></li>
                        <li><NavItem to="schedule">Schedule</NavItem></li>
                        <li><NavItem to="wod">WOD</NavItem></li> {/* New */}
                        <li><NavItem to="coaches">Coaches</NavItem></li>
                        <li><NavItem to="testimonials">Testimonials</NavItem></li>
                        <li><NavItem to="blog">Blog</NavItem></li> {/* Fixed: Changed } to > */}
                        <li><NavItem to="store">Store</NavItem></li> {/* New */}
                        <li><NavItem to="contact">Contact</NavItem></li>
                    </ul>
                </nav>
                <div className="md:hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none">
                        {isMenuOpen ? <X size={30} /> : <Menu size={30} />}
                    </button>
                </div>
            </div>
            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-gray-800 py-4 shadow-xl">
                    <ul className="flex flex-col items-center space-y-3 text-lg font-medium">
                        <li><NavItem to="home">Home</NavItem></li>
                        <li><NavItem to="about">About</NavItem></li>
                        <li><NavItem to="programs">Programs</NavItem></li>
                        <li><NavItem to="schedule">Schedule</NavItem></li>
                        <li><NavItem to="wod">WOD</NavItem></li> {/* New */}
                        <li><NavItem to="coaches">Coaches</NavItem></li>
                        <li><NavItem to="testimonials">Testimonials</NavItem></li>
                        <li><NavItem to="blog">Blog</NavItem></li>
                        <li><NavItem to="store">Store</NavItem></li>
                        <li><NavItem to="contact">Contact</NavItem></li>
                    </ul>
                </div>
            )}
        </header>
    );

    // Hero Section
    const HeroSection = () => (
        <section id="home" className="relative h-screen bg-cover bg-center flex items-center justify-center text-white"
            style={{
                backgroundImage: `url('/images/Logo808ROund.png')`,  
              //backgroundImage: `url('https://placehold.co/1920x1080/000000/87CEEB?text=CrossFit+808')`,
                backgroundAttachment: 'fixed',
            }}>
            <div className="absolute inset-0 bg-black opacity-70"></div>
            <div className="relative z-10 text-center px-4">
                <h1 className="text-5xl md:text-7xl font-extrabold leading-tight drop-shadow-lg animate-fade-in-up">
                    Unleash Your Potential at <br /><span className="text-sky-500">CrossFit 808</span>
                </h1>
                <p className="text-xl md:text-2xl mt-6 mb-10 max-w-2xl mx-auto drop-shadow-md animate-fade-in-up delay-200">
                    Join our community and transform your life through high-intensity functional fitness.
                </p>
                <div className="flex justify-center gap-4 animate-fade-in-up delay-400">
                    <Button onClick={() => window.location.href = '#programs'} icon={Award}>
                        View Programs
                    </Button>
                    <Button primary={false} onClick={() => window.location.href = '#contact'} icon={Mail}>
                        Get in Touch
                    </Button>
                </div>
            </div>
        </section>
    );

    // About Section
    const AboutSection = () => (
        <Section id="about" title="Our Philosophy" className="bg-gray-900 text-gray-300">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <p className="text-lg leading-relaxed mb-6">
                        At CrossFit 808, we believe in building a stronger, healthier community, one workout at a time. Our programming focuses on constantly varied functional movements performed at high intensity, designed to prepare you for any physical challenge life throws your way.
                    </p>
                    <p className="text-lg leading-relaxed mb-6">
                        More than just a gym, we are a family. Our experienced coaches are dedicated to providing personalized guidance, ensuring proper form, and motivating you to push past your limits safely. Whether you're a seasoned athlete or new to fitness, you'll find a supportive environment here.
                    </p>
                    <Button onClick={() => window.location.href = '#contact'} icon={Plus}>
                        Join Our Family
                    </Button>
                </div>
                <div className="relative">
                    <img
                        src="https://placehold.co/800x500/87CEEB/ffffff?text=Team+Workout"
                        alt="CrossFit 808 Team Workout"
                        className="rounded-xl shadow-xl transform hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute -bottom-4 -left-4 bg-sky-500 p-4 rounded-xl shadow-lg transform rotate-2">
                        <p className="text-white text-xl font-bold">Stronger Together</p>
                    </div>
                </div>
            </div>
        </Section>
    );

    // Programs Section
    const ProgramsSection = () => (
        <Section id="programs" title="Our Programs" className="bg-gray-800 text-gray-200">
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    {
                        title: "CrossFit Classes",
                        description: "Our core program, combining weightlifting, gymnastics, and metabolic conditioning for ultimate fitness.",
                        icon: <svg className="w-12 h-12 text-sky-500 mb-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
                    },
                    {
                        title: "Weightlifting",
                        description: "Improve your technique and strength in Olympic lifts (Snatch and Clean & Jerk) and powerlifting.",
                        icon: <svg className="w-12 h-12 text-sky-500 mb-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 12c0-1.1-.9-2-2-2h-3V7c0-.55-.45-1-1-1H7c-.55 0-1 .45-1 1v3H3c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h3v3c0 .55.45 1 1 1h7c.55 0 1-.45 1-1v-3h3c1.1 0 2-.9 2-2v-2zm-9 3H9v-2h2v2zm0-4H9V9h2v2zm4 0h-2V9h2v2zm0 4h-2v-2h2v2z"/></svg>
                    },
                    {
                        title: "Personal Training",
                        description: "One-on-one coaching tailored to your specific goals, schedule, and fitness level.",
                        icon: <svg className="w-12 h-12 text-sky-500 mb-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.38 0 2.5 1.12 2.5 2.5S13.38 10.5 12 10.5 9.5 9.38 9.5 8 10.62 5 12 5zm0 14.5c-2.73 0-5.26-1.55-6.5-4s-.9-5.11 0-6.5c1.24-1.39 3.77-2.05 6.5-2.05s5.26.66 6.5 2.05c.9 1.39.9 4.11 0 6.5-1.24 2.45-3.77 4-6.5 4z"/></svg>
                    },
                ].map((program, index) => (
                    <div key={index} className="bg-gray-700 p-8 rounded-xl shadow-xl flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300 border border-gray-600">
                        {program.icon}
                        <h3 className="text-2xl font-bold text-white mb-3">{program.title}</h3>
                        <p className="text-gray-300">{program.description}</p>
                    </div>
                ))}
            </div>
        </Section>
    );

    // Schedule Section
    const ScheduleSection = ({ dbInstance, isAuthReady, currentUser, userId, authInstance, isLoadingAuth }) => {
        // Dummy data for initial display, replace with actual PushPress iframe/link
        const [showPushPressModal, setShowPushPressModal] = useState(false);

        return (
            <Section id="schedule" title="Class Schedule" className="bg-gray-900 text-gray-300">
                <div className="bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-700">
                    <p className="text-xl text-center mb-6">Our classes run throughout the day to fit your busy lifestyle. Check out our weekly schedule below or use our integrated scheduling system.</p>
                    <div className="overflow-x-auto mb-8">
                        <table className="min-w-full divide-y divide-gray-700 rounded-lg overflow-hidden">
                            <thead className="bg-sky-600 text-white">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Time</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Monday</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tuesday</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Wednesday</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Thursday</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Friday</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Saturday</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Sunday</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-700 divide-y divide-gray-600">
                                {[
                                    { time: "5:00 AM", mon: "CrossFit", tue: "CrossFit", wed: "CrossFit", thu: "CrossFit", fri: "CrossFit", sat: "", sun: "" },
                                    { time: "6:00 AM", mon: "CrossFit", tue: "CrossFit", wed: "CrossFit", thu: "CrossFit", fri: "CrossFit", sat: "Open Gym", sun: "Open Gym" },
                                    { time: "9:00 AM", mon: "CrossFit", tue: "CrossFit", wed: "CrossFit", thu: "CrossFit", fri: "CrossFit", sat: "CrossFit", sun: "" },
                                    { time: "12:00 PM", mon: "CrossFit", tue: "CrossFit", wed: "CrossFit", thu: "CrossFit", fri: "CrossFit", sat: "", sun: "" },
                                    { time: "4:30 PM", mon: "CrossFit", tue: "CrossFit", wed: "CrossFit", thu: "CrossFit", fri: "CrossFit", sat: "", sun: "" },
                                    { time: "5:30 PM", mon: "CrossFit", tue: "CrossFit", wed: "CrossFit", thu: "CrossFit", fri: "CrossFit", sat: "", sun: "" },
                                    { time: "6:30 PM", mon: "CrossFit", tue: "CrossFit", wed: "CrossFit", thu: "CrossFit", fri: "CrossFit", sat: "", sun: "" },
                                ].map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-600 transition-colors duration-200">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{row.time}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{row.mon}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{row.tue}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{row.wed}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{row.thu}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{row.fri}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{row.sat}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{row.sun}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-sm text-center text-gray-400 mt-8">
                        *Open Gym hours are for experienced members only. Please check with a coach.
                    </p>
                    <div className="text-center mt-8">
                        <Button onClick={() => setShowPushPressModal(true)} icon={LayoutList} primary={true}>
                            View Live Schedule (PushPress)
                        </Button>
                    </div>
                </div>

                <Modal
                    isOpen={showPushPressModal}
                    title="Live Schedule & Booking"
                    message="Click the button below to view our live class schedule and book your spot via PushPress. You will be redirected to their platform."
                    onConfirm={() => {
                        window.open('https://app.pushpress.com/YOUR_GYM_ID/calendar', '_blank'); // Replace with actual PushPress link
                        setShowPushPressModal(false);
                    }}
                    onCancel={() => setShowPushPressModal(false)}
                    showCancel={true}
                    >
                    <p className="text-gray-400 text-sm mb-4">
                        (Note: This is a placeholder link. You would embed the actual PushPress calendar or link directly to your gym's PushPress page here.)
                    </p>
                </Modal>
            </Section>
        );
    };


    // Coaches Section
    const CoachesSection = () => {
        const coaches = [
            {
                name: "Elyse Umeda-Korth",
                title: "Head Coach & Founder",
                bio: "CrossFit Level 2 Trainer",
                img: "/images/coaches/Elyse_Umeda-300x300.jpg",
            },
            {
                name: "Rich Korth",
                title: "Coach and HFD",
                bio: "CrossFit Level 2 Trainer",
                img: "/images/coaches/Rich-300x300.jpg",
            },
            {
                name: "Joshua Akiona",
                title: "Coach and US Army",
                bio: "CrossFit Level 3 Trainer",
                img: "/images/coaches/Josh-Akiona-300x300.jpg",
            },
        ];

        return (
            <Section id="coaches" title="Meet Our Coaches" className="bg-gray-800 text-gray-200">
                <div className="grid md:grid-cols-3 gap-8">
                    {coaches.map((coach, index) => (
                        <div key={index} className="bg-gray-700 p-8 rounded-xl shadow-xl text-center transform hover:scale-105 transition-transform duration-300 border border-gray-600">
                            <img
                                src={coach.img}
                                alt={coach.name}
                                className="w-32 h-32 rounded-full mx-auto mb-6 object-cover object-center border-4 border-sky-500 shadow-md"
                            />
                            <h3 className="text-2xl font-bold text-white mb-2">{coach.name}</h3>
                            <p className="text-sky-400 font-semibold mb-4">{coach.title}</p>
                            <p className="text-gray-300 text-sm">{coach.bio}</p>
                        </div>
                    ))}
                </div>
            </Section>
        );
    };

    // Testimonials Section
    const TestimonialsSection = () => {
        const testimonials = [
            {
                quote: "CrossFit 808 changed my life! The coaches are amazing, and the community is incredibly supportive.",
                author: "Sarah J.",
                image: "https://placehold.co/80x80/87CEEB/ffffff?text=SJ"
            },
            {
                quote: "I've never been stronger or felt healthier. This is more than just a gym, it's a second home.",
                author: "Mark T.",
                image: "https://placehold.co/80x80/87CEEB/ffffff?text=MT"
            },
            {
                quote: "The programming is challenging but scalable, perfect for all fitness levels. Highly recommend!",
                author: "Emily R.",
                image: "https://placehold.co/80x80/87CEEB/ffffff?text=ER"
            },
        ];

        return (
            <Section id="testimonials" title="What Our Members Say" className="bg-gray-900 text-gray-300">
                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="bg-gray-800 p-8 rounded-xl shadow-xl flex flex-col items-center text-center transform hover:scale-102 transition-transform duration-300 border border-gray-700">
                            <img
                                src={testimonial.image}
                                alt={testimonial.author}
                                className="w-20 h-20 rounded-full mb-6 object-cover border-2 border-sky-500 shadow-md"
                            />
                            <p className="text-lg italic mb-4">"{testimonial.quote}"</p>
                            <p className="font-semibold text-sky-400">- {testimonial.author}</p>
                        </div>
                    ))}
                </div>
            </Section>
        );
    };

    // WOD Section (New)
    const WODSection = ({ dbInstance, isAuthReady, currentUser, userId, authInstance, isLoadingAuth }) => {
        const [wods, setWods] = useState([]);
        const [currentDayWod, setCurrentDayWod] = useState(null);
        const [showAddWodModal, setShowAddWodModal] = useState(false);
        const [showEditWodModal, setShowEditWodModal] = useState(false);
        const [currentWodToEdit, setCurrentWodToEdit] = useState(null);
        const [wodDate, setWodDate] = useState('');
        const [wodTitle, setWodTitle] = useState('');
        const [wodDescription, setWodDescription] = useState('');
        const [wodMovements, setWodMovements] = useState('');
        const [wodNotes, setWodNotes] = useState('');
        const [modalError, setModalError] = useState('');
        const [isDeleteWodModalOpen, setIsDeleteWodModalOpen] = useState(false);
        const [wodToDelete, setWodToDelete] = useState(null);
        const [displayMode, setDisplayMode] = useState('current'); // 'current' or 'manage'


        // Helper to format date for input type="date"
        const formatDateForInput = (date) => {
            if (!date) return '';
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Helper to format date for display
        const formatDateForDisplay = (timestamp) => {
            if (!timestamp) return 'No Date';
            const dateObj = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
            return dateObj.toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
        };

        // Fetch WODs from Firestore
        useEffect(() => {
            if (!dbInstance || !isAuthReady) {
                console.log("Firestore not ready or not authenticated for WODs.");
                return;
            }

            const wodsRef = collection(dbInstance, `artifacts/${appId}/public/data/wods`);
            // Order by date to easily find current/next WOD
            const q = query(wodsRef, orderBy('date', 'asc'));

            const unsubscribe = onSnapshot(q,
                (snapshot) => {
                    const fetchedWods = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        // Ensure date is a JS Date object for comparisons
                        date: doc.data().date instanceof Timestamp ? doc.data().date.toDate() : new Date(doc.data().date),
                    }));
                    setWods(fetchedWods);
                    setModalError(''); // Clear error on successful fetch

                    // Find today's WOD
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Normalize to start of day

                    let foundWod = null;
                    // Try to find exact match for today
                    foundWod = fetchedWods.find(wod => {
                        const wodDateObj = new Date(wod.date);
                        wodDateObj.setHours(0, 0, 0, 0);
                        return wodDateObj.getTime() === today.getTime();
                    });

                    // If no exact match, find the nearest future WOD or the most recent past WOD
                    if (!foundWod) {
                        const futureWods = fetchedWods.filter(wod => {
                            const wodDateObj = new Date(wod.date);
                            wodDateObj.setHours(0, 0, 0, 0);
                            return wodDateObj.getTime() >= today.getTime();
                        }).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date ascending

                        if (futureWods.length > 0) {
                            foundWod = futureWods[0]; // Nearest upcoming WOD
                        } else {
                            // No future WODs, get the most recent past WOD
                            const pastWods = fetchedWods.filter(wod => {
                                const wodDateObj = new Date(wod.date);
                                wodDateObj.setHours(0, 0, 0, 0);
                                return wodDateObj.getTime() < today.getTime();
                            }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

                            if (pastWods.length > 0) {
                                foundWod = pastWods[0]; // Most recent past WOD
                            }
                        }
                    }
                    setCurrentDayWod(foundWod);

                },
                (error) => {
                    console.error("Error fetching WODs:", error);
                    setModalError("Failed to load WODs.");
                }
            );

            // Cleanup listener on unmount
            return () => unsubscribe();
        }, [dbInstance, isAuthReady, userId]);

        const handleAddWod = async () => {
            if (!wodDate || !wodTitle || !wodDescription) {
                setModalError('Date, Title, and Description cannot be empty.');
                return;
            }
            if (!dbInstance) {
                setModalError('Database not initialized.');
                return;
            }

            try {
                const wodsRef = collection(dbInstance, `artifacts/${appId}/public/data/wods`);
                await addDoc(wodsRef, {
                    date: Timestamp.fromDate(new Date(wodDate)), // Store date as Firestore Timestamp
                    title: wodTitle,
                    description: wodDescription,
                    movements: wodMovements,
                    notes: wodNotes,
                    authorId: currentUser?.uid || 'anonymous',
                    authorName: currentUser?.email || 'Anonymous',
                    timestamp: serverTimestamp(),
                });
                setShowAddWodModal(false);
                setWodDate('');
                setWodTitle('');
                setWodDescription('');
                setWodMovements('');
                setWodNotes('');
                setModalError('');
            } catch (error) {
                console.error("Error adding WOD:", error);
                setModalError(`Failed to add WOD: ${error.message}`);
            }
        };

        const handleEditWod = async () => {
            if (!wodDate || !wodTitle || !wodDescription) {
                setModalError('Date, Title, and Description cannot be empty.');
                return;
            }
            if (!dbInstance || !currentWodToEdit?.id) {
                setModalError('Database not initialized or no WOD selected for editing.');
                return;
            }

            try {
                const wodRef = doc(dbInstance, `artifacts/${appId}/public/data/wods`, currentWodToEdit.id);
                await updateDoc(wodRef, {
                    date: Timestamp.fromDate(new Date(wodDate)),
                    title: wodTitle,
                    description: wodDescription,
                    movements: wodMovements,
                    notes: wodNotes,
                });
                setShowEditWodModal(false);
                setWodDate('');
                setWodTitle('');
                setWodDescription('');
                setWodMovements('');
                setWodNotes('');
                setCurrentWodToEdit(null);
                setModalError('');
            } catch (error) {
                console.error("Error updating WOD:", error);
                setModalError(`Failed to update WOD: ${error.message}`);
            }
        };

        const handleDeleteWod = async () => {
            if (!dbInstance || !wodToDelete?.id) {
                setModalError('Database not initialized or no WOD selected for deletion.');
                return;
            }

            try {
                const wodRef = doc(dbInstance, `artifacts/${appId}/public/data/wods`, wodToDelete.id);
                await deleteDoc(wodRef);
                setIsDeleteWodModalOpen(false);
                setWodToDelete(null);
                setModalError('');
            } catch (error) {
                console.error("Error deleting WOD:", error);
                setModalError(`Failed to delete WOD: ${error.message}`);
            }
        };

        const openAddWodModal = () => {
            setWodDate(formatDateForInput(new Date())); // Default to today's date
            setWodTitle('');
            setWodDescription('');
            setWodMovements('');
            setWodNotes('');
            setModalError('');
            setShowAddWodModal(true);
        };

        const openEditWodModal = (wod) => {
            setCurrentWodToEdit(wod);
            setWodDate(formatDateForInput(wod.date));
            setWodTitle(wod.title);
            setWodDescription(wod.description);
            setWodMovements(wod.movements || '');
            setWodNotes(wod.notes || '');
            setModalError('');
            setShowEditWodModal(true);
        };

        const openDeleteWodModal = (wod) => {
            setWodToDelete(wod);
            setModalError('');
            setIsDeleteWodModalOpen(true);
        };

        const handleSignOut = async () => {
            if (authInstance) {
                try {
                    await signOut(authInstance);
                    setCurrentUser(null);
                    setUserId(crypto.randomUUID());
                    console.log("User signed out.");
                } catch (error) {
                    console.error("Error signing out:", error);
                }
            }
        };

        if (isLoadingAuth) {
            return (
                <Section id="wod" title="Workout of the Day" className="bg-gray-900 text-gray-300">
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="animate-spin text-sky-500" size={48} />
                        <p className="ml-4 text-xl">Loading WODs...</p>
                    </div>
                </Section>
            );
        }

        return (
            <Section id="wod" title="Workout of the Day" className="bg-gray-900 text-gray-300">
                {currentUser && (
                    <div className="flex justify-between items-center mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700">
                         <span className="text-gray-400 text-sm">
                            Logged in as: <span className="font-bold text-white">{currentUser.email || currentUser.uid}</span>
                            <span className="ml-4">User ID: <span className="font-mono text-xs">{userId}</span></span>
                        </span>
                        <div className="flex gap-4">
                            <Button onClick={openAddWodModal} icon={Plus} primary={true}>Add New WOD</Button>
                            <Button onClick={() => setDisplayMode(displayMode === 'current' ? 'manage' : 'current')} icon={displayMode === 'current' ? LayoutList : Dumbbell} primary={false}>
                                {displayMode === 'current' ? 'Manage WODs' : 'View Current WOD'}
                            </Button>
                            <Button onClick={handleSignOut} icon={LogOut} primary={false}>Sign Out</Button>
                        </div>
                    </div>
                )}

                {displayMode === 'current' ? (
                    <div className="bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-700 text-center">
                        {currentDayWod ? (
                            <>
                                <p className="text-sky-400 text-xl font-semibold mb-2">WOD for {formatDateForDisplay(currentDayWod.date)}</p>
                                <h3 className="text-4xl font-extrabold text-white mb-6">{currentDayWod.title}</h3>
                                <div className="text-gray-300 text-lg leading-relaxed mb-6 whitespace-pre-wrap text-left mx-auto max-w-2xl">
                                    {currentDayWod.description}
                                </div>
                                {currentDayWod.movements && (
                                    <div className="text-gray-300 text-base mb-4 text-left mx-auto max-w-2xl">
                                        <h4 className="font-bold text-white mb-2">Movements:</h4>
                                        <p className="whitespace-pre-wrap">{currentDayWod.movements}</p>
                                    </div>
                                )}
                                {currentDayWod.notes && (
                                    <div className="text-gray-400 text-sm text-left mx-auto max-w-2xl">
                                        <h4 className="font-bold text-white mb-1">Notes/Scaling:</h4>
                                        <p className="whitespace-pre-wrap">{currentWodToEdit?.notes || currentDayWod.notes}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-xl text-gray-400">No WOD available for today. Check back soon!</p>
                        )}
                    </div>
                ) : (
                    // WOD Management View
                    <div>
                        {wods.length === 0 ? (
                            <p className="text-center text-xl mt-8">No WODs found. {currentUser && "Click 'Add New WOD' to create one!"}</p>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {wods.map((wod) => (
                                    <div key={wod.id} className="bg-gray-800 rounded-xl shadow-xl overflow-hidden flex flex-col border border-gray-700">
                                        <div className="p-6 flex-grow">
                                            <p className="text-sky-400 text-sm font-semibold mb-2 flex items-center gap-1"><Calendar size={14} /> {formatDateForDisplay(wod.date)}</p>
                                            <h3 className="text-2xl font-bold text-white mb-3">{wod.title}</h3>
                                            <p className="text-gray-300 mb-4 text-base line-clamp-3 whitespace-pre-wrap">{wod.description}</p>
                                            {wod.movements && <p className="text-gray-400 text-sm mb-2 line-clamp-2"><strong>Movements:</strong> {wod.movements}</p>}
                                            {wod.notes && <p className="text-gray-400 text-sm line-clamp-2"><strong>Notes:</strong> {wod.notes}</p>}
                                        </div>
                                        {currentUser && (
                                            <div className="flex justify-end p-4 bg-gray-700 border-t border-gray-600 gap-2">
                                                <Button onClick={() => openEditWodModal(wod)} icon={Edit} primary={false} className="!px-3 !py-2 !text-sm">Edit</Button>
                                                <Button onClick={() => openDeleteWodModal(wod)} icon={Trash2} primary={false} className="!px-3 !py-2 !text-sm bg-red-600 hover:bg-red-700">Delete</Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Add WOD Modal */}
                <Modal
                    isOpen={showAddWodModal}
                    title="Add New WOD"
                    onConfirm={handleAddWod}
                    onCancel={() => setShowAddWodModal(false)}
                >
                    {modalError && <p className="text-red-500 text-center mb-4">{modalError}</p>}
                    <div className="mb-4">
                        <label htmlFor="wodDate" className="block text-gray-300 text-sm font-bold mb-2">Date</label>
                        <input
                            type="date"
                            id="wodDate"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                            value={wodDate}
                            onChange={(e) => setWodDate(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="wodTitle" className="block text-gray-300 text-sm font-bold mb-2">Title</label>
                        <input
                            type="text"
                            id="wodTitle"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                            value={wodTitle}
                            onChange={(e) => setWodTitle(e.target.value)}
                            placeholder="e.g., 'Murph', 'Fran', 'For Time'"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="wodDescription" className="block text-gray-300 text-sm font-bold mb-2">Description</label>
                        <textarea
                            id="wodDescription"
                            rows="6"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                            value={wodDescription}
                            onChange={(e) => setWodDescription(e.target.value)}
                            placeholder="e.g., '21-15-9 reps of: Thrusters, Pull-ups'"
                        ></textarea>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="wodMovements" className="block text-gray-300 text-sm font-bold mb-2">Movements (Optional)</label>
                        <input
                            type="text"
                            id="wodMovements"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                            value={wodMovements}
                            onChange={(e) => setWodMovements(e.target.value)}
                            placeholder="e.g., 'Thrusters, Pull-ups, Box Jumps'"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="wodNotes" className="block text-gray-300 text-sm font-bold mb-2">Notes/Scaling (Optional)</label>
                        <textarea
                            id="wodNotes"
                            rows="3"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                            value={wodNotes}
                            onChange={(e) => setWodNotes(e.target.value)}
                            placeholder="e.g., 'Scale pull-ups to jumping pull-ups. Lighten load on thrusters.'"
                        ></textarea>
                    </div>
                </Modal>

                {/* Edit WOD Modal */}
                <Modal
                    isOpen={showEditWodModal}
                    title="Edit WOD"
                    onConfirm={handleEditWod}
                    onCancel={() => setShowEditWodModal(false)}
                >
                    {modalError && <p className="text-red-500 text-center mb-4">{modalError}</p>}
                    <div className="mb-4">
                        <label htmlFor="editWodDate" className="block text-gray-300 text-sm font-bold mb-2">Date</label>
                        <input
                            type="date"
                            id="editWodDate"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                            value={wodDate}
                            onChange={(e) => setWodDate(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="editWodTitle" className="block text-gray-300 text-sm font-bold mb-2">Title</label>
                        <input
                            type="text"
                            id="editWodTitle"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                            value={wodTitle}
                            onChange={(e) => setWodTitle(e.target.value)}
                            placeholder="e.g., 'Murph', 'Fran', 'For Time'"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="editWodDescription" className="block text-gray-300 text-sm font-bold mb-2">Description</label>
                        <textarea
                            id="editWodDescription"
                            rows="6"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                            value={wodDescription}
                            onChange={(e) => setWodDescription(e.target.value)}
                            placeholder="e.g., '21-15-9 reps of: Thrusters, Pull-ups'"
                        ></textarea>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="editWodMovements" className="block text-gray-300 text-sm font-bold mb-2">Movements (Optional)</label>
                        <input
                            type="text"
                            id="editWodMovements"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                            value={wodMovements}
                            onChange={(e) => setWodMovements(e.target.value)}
                            placeholder="e.g., 'Thrusters, Pull-ups, Box Jumps'"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="editWodNotes" className="block text-gray-300 text-sm font-bold mb-2">Notes/Scaling (Optional)</label>
                        <textarea
                            id="editWodNotes"
                            rows="3"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                            value={wodNotes}
                            onChange={(e) => setWodNotes(e.target.value)}
                            placeholder="e.g., 'Scale pull-ups to jumping pull-ups. Lighten load on thrusters.'"
                        ></textarea>
                    </div>
                </Modal>

                {/* Delete WOD Confirmation Modal */}
                <Modal
                    isOpen={isDeleteWodModalOpen}
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete the WOD for "${formatDateForDisplay(wodToDelete?.date)} - ${wodToDelete?.title}"? This action cannot be undone.`}
                    onConfirm={handleDeleteWod}
                    onCancel={() => setIsDeleteWodModalOpen(false)}
                    showCancel={true}
                />
            </Section>
        );
    };

    // Online Store Section (New)
    const StoreSection = () => (
        <Section id="store" title="Our Online Store" className="bg-gray-800 text-gray-200">
            <div className="bg-gray-700 p-8 rounded-xl shadow-xl border border-gray-600 text-center">
                <ShoppingCart size={60} className="text-sky-500 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-white mb-4">Gear Up, Train Hard!</h3>
                <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
                    Check out our official CrossFit 808 merchandise, supplements, and equipment. Represent your box and perform your best!
                </p>
                <Button onClick={() => window.open('https://your-store-link.com', '_blank')} icon={ShoppingCart}>
                    Shop Now
                </Button>
                <p className="text-sm text-gray-400 mt-4">
                    (Note: This button would link to your external e-commerce platform like Shopify, WooCommerce, etc.)
                </p>
                <div className="grid md:grid-cols-3 gap-8 mt-12">
                    <div className="bg-gray-600 rounded-xl p-6 text-center">
                        <img src="https://placehold.co/200x200/ffffff/000000?text=T-Shirt" alt="T-Shirt" className="mx-auto mb-4 rounded-lg" />
                        <h4 className="text-xl font-semibold text-white mb-2">CrossFit 808 Tee</h4>
                        <p className="text-sky-300 font-bold">$25.00</p>
                    </div>
                    <div className="bg-gray-600 rounded-xl p-6 text-center">
                        <img src="https://placehold.co/200x200/ffffff/000000?text=Hoodie" alt="Hoodie" className="mx-auto mb-4 rounded-lg" />
                        <h4 className="text-xl font-semibold text-white mb-2">Performance Hoodie</h4>
                        <p className="text-sky-300 font-bold">$45.00</p>
                    </div>
                    <div className="bg-gray-600 rounded-xl p-6 text-center">
                        <img src="https://placehold.co/200x200/ffffff/000000?text=Water+Bottle" alt="Water Bottle" className="mx-auto mb-4 rounded-lg" />
                        <h4 className="text-xl font-semibold text-white mb-2">Gym Water Bottle</h4>
                        <p className="text-sky-300 font-bold">$15.00</p>
                    </div>
                </div>
            </div>
        </Section>
    );

    // Blog Section (with Firestore integration)
    const BlogSection = ({ dbInstance, isAuthReady, currentUser, userId, authInstance, isLoadingAuth }) => {
        const [posts, setPosts] = useState([]);
        const [showAddModal, setShowAddModal] = useState(false);
        const [showEditModal, setShowEditModal] = useState(false);
        const [currentPost, setCurrentPost] = useState(null);
        const [postTitle, setPostTitle] = useState('');
        const [postContent, setPostContent] = useState('');
        const [postImage, setPostImage] = useState('');
        const [modalError, setModalError] = useState('');
        const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
        const [postToDelete, setPostToDelete] = useState(null);

        // Fetch posts from Firestore
        useEffect(() => {
            if (!dbInstance || !isAuthReady) {
                console.log("Firestore not ready or not authenticated for blog posts.");
                return;
            }

            const postsRef = collection(dbInstance, `artifacts/${appId}/public/data/blogPosts`);
            const q = query(postsRef, orderBy('timestamp', 'desc')); // Order by timestamp

            // Listen for real-time updates
            const unsubscribe = onSnapshot(q,
                (snapshot) => {
                    const fetchedPosts = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        // Convert Firestore timestamp to readable date string if it exists
                        timestamp: doc.data().timestamp ? new Date(doc.data().timestamp.toDate()).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        }) : 'No Date'
                    }));
                    setPosts(fetchedPosts);
                    setModalError(''); // Clear error on successful fetch
                },
                (error) => {
                    console.error("Error fetching blog posts:", error);
                    setModalError("Failed to load blog posts.");
                }
            );

            // Cleanup listener on unmount
            return () => unsubscribe();
        }, [dbInstance, isAuthReady, userId]); // Re-run if dbInstance, auth state, or userId changes

        const handleAddPost = async () => {
            if (!postTitle || !postContent) {
                setModalError('Title and Content cannot be empty.');
                return;
            }

            if (!dbInstance) {
                setModalError('Database not initialized.');
                return;
            }

            try {
                const postsRef = collection(dbInstance, `artifacts/${appId}/public/data/blogPosts`);
                await addDoc(postsRef, {
                    title: postTitle,
                    content: postContent,
                    image: postImage || `https://placehold.co/600x400/87CEEB/ffffff?text=Blog+Post`, // Default image
                    authorId: currentUser?.uid || 'anonymous', // Store author ID
                    authorName: currentUser?.email || 'Anonymous', // Store author email/name
                    timestamp: serverTimestamp(), // Firestore server timestamp
                });
                setShowAddModal(false);
                setPostTitle('');
                setPostContent('');
                setPostImage('');
                setModalError('');
            } catch (error) {
                console.error("Error adding post:", error);
                setModalError(`Failed to add post: ${error.message}`);
            }
        };

        const handleEditPost = async () => {
            if (!postTitle || !postContent) {
                setModalError('Title and Content cannot be empty.');
                return;
            }

            if (!dbInstance || !currentPost?.id) {
                setModalError('Database not initialized or no post selected for editing.');
                return;
            }

            try {
                const postRef = doc(dbInstance, `artifacts/${appId}/public/data/blogPosts`, currentPost.id);
                await updateDoc(postRef, {
                    title: postTitle,
                    content: postContent,
                    image: postImage,
                });
                setShowEditModal(false);
                setPostTitle('');
                setPostContent('');
                setPostImage('');
                setCurrentPost(null);
                setModalError('');
            } catch (error) {
                console.error("Error updating post:", error);
                setModalError(`Failed to update post: ${error.message}`);
            }
        };

        const handleDeletePost = async () => {
            if (!dbInstance || !postToDelete?.id) {
                setModalError('Database not initialized or no post selected for deletion.');
                return;
            }

            try {
                const postRef = doc(dbInstance, `artifacts/${appId}/public/data/blogPosts`, postToDelete.id);
                await deleteDoc(postRef);
                setIsDeleteModalOpen(false);
                setPostToDelete(null);
                setModalError('');
            } catch (error) {
                console.error("Error deleting post:", error);
                setModalError(`Failed to delete post: ${error.message}`);
            }
        };

        const openAddModal = () => {
            setPostTitle('');
            setPostContent('');
            setPostImage('');
            setModalError('');
            setShowAddModal(true);
        };

        const openEditModal = (post) => {
            setCurrentPost(post);
            setPostTitle(post.title);
            setPostContent(post.content);
            setPostImage(post.image || '');
            setModalError('');
            setShowEditModal(true);
        };

        const openDeleteModal = (post) => {
            setPostToDelete(post);
            setModalError('');
            setIsDeleteModalOpen(true);
        };

        const handleSignOut = async () => {
            if (authInstance) {
                try {
                    await signOut(authInstance);
                    setCurrentUser(null);
                    setUserId(crypto.randomUUID()); // Reset to anonymous ID
                    console.log("User signed out.");
                } catch (error) {
                    console.error("Error signing out:", error);
                }
            }
        };

        if (isLoadingAuth) {
            return (
                <Section id="blog" title="Our Latest News" className="bg-gray-900 text-gray-300">
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="animate-spin text-sky-500" size={48} />
                        <p className="ml-4 text-xl">Loading blog posts...</p>
                    </div>
                </Section>
            );
        }

        return (
            <Section id="blog" title="Our Latest News" className="bg-gray-900 text-gray-300">
                {currentUser && ( // Show admin controls only if user is logged in (simulating admin)
                    <div className="flex justify-between items-center mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <span className="text-gray-400 text-sm">
                            Logged in as: <span className="font-bold text-white">{currentUser.email || currentUser.uid}</span>
                            <span className="ml-4">User ID: <span className="font-mono text-xs">{userId}</span></span>
                        </span>
                        <div className="flex gap-4">
                            <Button onClick={openAddModal} icon={Plus} primary={true}>Add New Post</Button>
                            <Button onClick={handleSignOut} icon={LogOut} primary={false}>Sign Out</Button>
                        </div>
                    </div>
                )}

                {posts.length === 0 ? (
                    <p className="text-center text-xl mt-8">No blog posts found. {currentUser && "Click 'Add New Post' to create one!"}</p>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <div key={post.id} className="bg-gray-800 rounded-xl shadow-xl overflow-hidden flex flex-col border border-gray-700">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-48 object-cover rounded-t-xl"
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/87CEEB/ffffff?text=Blog+Post+Fallback'; }}
                                />
                                <div className="p-6 flex-grow">
                                    <h3 className="text-2xl font-bold text-white mb-3">{post.title}</h3>
                                    <p className="text-gray-400 text-sm mb-2 flex items-center gap-1"><Calendar size={14} /> {post.timestamp}</p>
                                    <p className="text-gray-300 mb-4 text-base line-clamp-3">{post.content}</p>
                                    {/* You could add a "Read More" link here */}
                                </div>
                                {currentUser && ( // Admin controls for individual posts
                                    <div className="flex justify-end p-4 bg-gray-700 border-t border-gray-600 gap-2">
                                        <Button onClick={() => openEditModal(post)} icon={Edit} primary={false} className="!px-3 !py-2 !text-sm">Edit</Button>
                                        <Button onClick={() => openDeleteModal(post)} icon={Trash2} primary={false} className="!px-3 !py-2 !text-sm bg-red-600 hover:bg-red-700">Delete</Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Post Modal */}
                <Modal
                    isOpen={showAddModal}
                    title="Add New Blog Post"
                    onConfirm={handleAddPost}
                    onCancel={() => setShowAddModal(false)}
                >
                    {modalError && <p className="text-red-500 text-center mb-4">{modalError}</p>}
                    <div className="mb-4">
                        <label htmlFor="postTitle" className="block text-gray-300 text-sm font-bold mb-2">Title</label>
                        <input
                            type="text"
                            id="postTitle"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                            value={postTitle}
                            onChange={(e) => setPostTitle(e.target.value)}
                            placeholder="Enter post title"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="postImage" className="block text-gray-300 text-sm font-bold mb-2">Image URL (Optional)</label>
                        <input
                            type="text"
                            id="postImage"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                            value={postImage}
                            onChange={(e) => setPostImage(e.target.value)}
                            placeholder="e.g., https://example.com/image.jpg"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="postContent" className="block text-gray-300 text-sm font-bold mb-2">Content</label>
                        <textarea
                            id="postContent"
                            rows="6"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            placeholder="Write your blog post content here..."
                        ></textarea>
                    </div>
                </Modal>

                {/* Edit Post Modal */}
                <Modal
                    isOpen={showEditModal}
                    title="Edit Blog Post"
                    onConfirm={handleEditPost}
                    onCancel={() => setShowEditModal(false)}
                >
                    {modalError && <p className="text-red-500 text-center mb-4">{modalError}</p>}
                    <div className="mb-4">
                        <label htmlFor="editPostTitle" className="block text-gray-300 text-sm font-bold mb-2">Title</label>
                        <input
                            type="text"
                            id="editPostTitle"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                            value={postTitle}
                            onChange={(e) => setPostTitle(e.target.value)}
                            placeholder="Enter post title"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="editPostImage" className="block text-gray-300 text-sm font-bold mb-2">Image URL (Optional)</label>
                        <input
                            type="text"
                            id="editPostImage"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                            value={postImage}
                            onChange={(e) => setPostImage(e.target.value)}
                            placeholder="e.g., https://example.com/image.jpg"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="editPostContent" className="block text-gray-300 text-sm font-bold mb-2">Content</label>
                        <textarea
                            id="editPostContent"
                            rows="6"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            placeholder="Write your blog post content here..."
                        ></textarea>
                    </div>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={isDeleteModalOpen}
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete the post "${postToDelete?.title}"? This action cannot be undone.`}
                    onConfirm={handleDeletePost}
                    onCancel={() => setIsDeleteModalOpen(false)}
                    showCancel={true}
                />
            </Section>
        );
    };

    // Contact Section
    const ContactSection = () => (
        <Section id="contact" title="Get in Touch" className="bg-gray-800 text-gray-200">
            <div className="grid md:grid-cols-2 gap-12 items-start">
                <div>
                    <p className="text-lg mb-6">
                        Ready to start your fitness journey? Have questions about our programs or schedule? Reach out to us using the contact details below or fill out the form. We'd love to hear from you!
                    </p>
                    <ul className="space-y-4 text-lg">
                        <li className="flex items-center gap-3">
                            <MapPin size={24} className="text-sky-500" />
                            <span>123 CrossFit Lane, Honolulu, HI 96814</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Phone size={24} className="text-sky-500" />
                            <span>(808) 555-1234</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Mail size={24} className="text-sky-500" />
                            <span>info@crossfit808.com</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Clock size={24} className="text-sky-500" />
                            <span>Mon-Fri: 5 AM - 8 PM, Sat: 6 AM - 12 PM, Sun: Closed</span>
                        </li>
                    </ul>
                </div>
                <div className="bg-gray-700 p-8 rounded-xl shadow-xl border border-gray-600">
                    <form className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-gray-300 text-sm font-bold mb-2">Name</label>
                            <input
                                type="text"
                                id="name"
                                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                                placeholder="Your Name"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">Email</label>
                            <input
                                type="email"
                                id="email"
                                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                                placeholder="your@email.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-gray-300 text-sm font-bold mb-2">Message</label>
                            <textarea
                                id="message"
                                rows="5"
                                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200 border-gray-600"
                                placeholder="Your Message"
                            ></textarea>
                        </div>
                        <Button type="submit" className="w-full">
                            Send Message
                        </Button>
                    </form>
                </div>
            </div>
            <div className="mt-12">
                <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3714.283838421453!2d-157.85833328574044!3d21.2995383858487!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7c006d9d1b0d0d0d%3A0x6b0d0d0d0d0d0d0d!2sCrossFit%20808!5e0!3m2!1sen!2sus!4v1678901234567!5m2!1sen!2sus"
                    width="100%"
                    height="450"
                    style={{ border: 0, borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
            </div>
        </Section>
    );

    // Footer
    const Footer = () => (
        <footer className="bg-gray-900 py-12 text-gray-400 text-center">
            <div className="container mx-auto px-4">
                <div className="flex justify-center space-x-6 mb-6">
                    <a href="https://www.instagram.com/808crossfit/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sky-500 transition-colors duration-300">
                        <Instagram size={30} />
                    </a>
                    <a href="https://www.facebook.com/808crossfit/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sky-500 transition-colors duration-300">
                        <Facebook size={30} />
                    </a>
                </div>
                <p className="text-lg mb-2">
                    &copy; {new Date().getFullYear()} CrossFit 808. All rights reserved.
                </p>
                <p className="text-sm">
                    Built with passion in Honolulu, HI.
                </p>
            </div>
        </footer>
    );

    return (
        <div className="min-h-screen bg-gray-950 font-inter antialiased">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    background-color: #0d0d0d; /* Dark background */
                }
                .container {
                    max-width: 1200px;
                }
                html {
                    scroll-behavior: smooth;
                }
                /* Custom utility classes for animation */
                .animate-fade-in-up {
                    animation: fadeInUp 1s ease-out forwards;
                    opacity: 0;
                }
                .delay-200 { animation-delay: 0.2s; }
                .delay-400 { animation-delay: 0.4s; }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                `}
            </style>
            <Header />
            <main className="pt-20"> {/* Adjust padding top to account for fixed header */}
                <HeroSection />
                <AboutSection />
                <ProgramsSection />
                <ScheduleSection
                    dbInstance={dbInstance}
                    isAuthReady={isAuthReady}
                    currentUser={currentUser}
                    userId={userId}
                    authInstance={authInstance}
                    isLoadingAuth={isLoadingAuth}
                />
                <WODSection
                    dbInstance={dbInstance}
                    isAuthReady={isAuthReady}
                    currentUser={currentUser}
                    userId={userId}
                    authInstance={authInstance}
                    isLoadingAuth={isLoadingAuth}
                />
                <CoachesSection />
                <TestimonialsSection />
                <BlogSection
                    dbInstance={dbInstance}
                    isAuthReady={isAuthReady}
                    currentUser={currentUser}
                    userId={userId}
                    authInstance={authInstance}
                    isLoadingAuth={isLoadingAuth}
                />
                <StoreSection />
                <ContactSection />
            </main>
            <Footer />
        </div>
    );
}

export default App;
