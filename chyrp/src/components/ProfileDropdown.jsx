import React, { useState, useEffect, useRef } from 'react';
import { UserIcon, ChevronDownIcon } from './Icons.jsx';

const ProfileDropdown = ({ token, setPage, handleLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const navigate = (pageName) => {
        setPage({ name: pageName });
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-300"/>
                <ChevronDownIcon />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-xl z-20 py-1 border dark:border-gray-700">
                    {token ? (
                        <>
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate('create-post'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">New Post</a>
                            <hr className="border-gray-200 dark:border-gray-700" />
                            <button onClick={() => {handleLogout(); setIsOpen(false);}} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Logout</button>
                        </>
                    ) : (
                        <>
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate('login'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Login</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate('register'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Register</a>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;

