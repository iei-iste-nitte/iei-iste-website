
import Opening from "./components/Opening";
import About from "./components/sections/About";
import Events from "./components/sections/Events";
import Team from "./components/sections/Team";
import Gallery from "./components/sections/Gallery";
import Contact from "./components/sections/Contact";
import Footer from "./components/sections/Footer";

export default function Home() {
  return (
    <>
      <Opening />
      <div className="curtain">
        <About />
        <Events />
        <Team />
        <Gallery />
        <Contact />
        <Footer />
      </div>
    </>
  );
}
