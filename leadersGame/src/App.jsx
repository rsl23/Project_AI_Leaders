import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Arena from "./components/Arena";
import ArenaVsAI from "./components/ArenaVsAi";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import Menu from "./components/Menu";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route index element={<Menu />}></Route>
      <Route path="arena" element={<Arena />}></Route>
      <Route path="arenavsai" element={<ArenaVsAI />}></Route>
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
  // (
  // <div className="flex flex-col justify-center items-center w-screen h-screen">
  //   <Arena />
  // </div>
  // );
}

export default App;
