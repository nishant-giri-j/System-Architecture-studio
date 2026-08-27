"use client";
import { createContext } from "react";
import { technologyLibrary, type TechnologyDefinition } from "@architecture-studio/shared";

export const TechContext = createContext<TechnologyDefinition[]>(technologyLibrary);
