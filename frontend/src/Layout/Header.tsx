import { NavLink, Link, Outlet } from "react-router-dom";
import UberLESSLogo from "../assets/UberLESSLogo.svg";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { PlusCircle, List, Globe, ShoppingBag } from "lucide-react";

export default function Header(): JSX.Element {
  return (
    <>
      <header className="fixed top-0 z-50 py-2 w-full border-b border-border bg-background/60 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 gap-2 max-w-screen-2xl items-center justify-between">
          <div className="flex items-center gap-6 md:gap-10">
            <Link to="/app">
              <img className="w-40" src={UberLESSLogo} alt="" />
            </Link>
          </div>
          <div className="flex items-center gap-4"></div>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavLink to="/app/missions/new">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nowa misja
                  </NavigationMenuLink>
                </NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink to="/app/missions">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <List className="mr-2 h-4 w-4" />
                    Misje
                  </NavigationMenuLink>
                </NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink to="/app/globe">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Globe className="mr-2 h-4 w-4" />
                    Mapa
                  </NavigationMenuLink>
                </NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink to="/app/marketplace">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Rynek
                  </NavigationMenuLink>
                </NavLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </header>
      <Outlet />
    </>
  );
}
