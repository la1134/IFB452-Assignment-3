import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout = () => {
    return(
        <>
        <Header/>
        <main className="pt-8">
            <Outlet />
        </main>
        </>
    )
}

export default Layout;