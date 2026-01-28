[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/iH4J_z2C)
# 3-2-More-CSS-main (Advance CSS)

## Overview

This lab guides you through styling a **Campus Events Dashboard** using CSS. You’ll work with a realistic page that displays featured events, event details, quick stats, categories, and location alerts. Your task is to complete the TODOs in the stylesheet to improve layout, spacing, colors, and typography—without changing the provided HTML structure.

The focus is on applying CSS concepts to a real UI scenario rather than describing CSS concepts in the page content.

## What You'll Learn

* **Common Properties**: Theme colors, backgrounds, gradients, display values, and CSS variables  
* **Fonts & Text**: Font families, sizing units (px/em/rem), font weights, text transforms, and line-height  
* **Box Model**: Margin, padding, border, width/height, and `box-sizing` for cards, stats, and badges  
* **Flexbox**: Flexible toolbars, responsive grids, alignment, wrapping, and spacing  
* **Positioning & Stacking**: Creating badges, labels, and overlays using `static`, `relative`, `absolute`, `fixed`, and `z-index`

## Prerequisites

* Basic understanding of HTML structure (elements, classes, and ids)  
* Any modern web browser (Chrome, Firefox, Safari, Edge)  
* A text editor (VS Code, Sublime Text, Notepad++)

## Reading Assignment
Read the following **sections** from the Zybooks.

- 3.5 Font and text properties
- 3.6 Box model
- 3.7 Flexbox
- 3.8 Positioning elements

## Files

* `index.html`: Markup for the Campus Events Dashboard (featured event, details, stats, categories, locations)  
* `styles.css`: CSS file containing TODOs you will complete  

## Project Structure

```
3-2-More-CSS-main/
├── index.html
├── styles.css
└── README.md
```

## Instructions

> **Note:**  
> Please follow the steps strictly to gain good marks in the assignment.  
>  
> **Due Date:** 28 Jan, 2026, **11:59 PM**

### Step 1: Set Up the Project

1. Open `index.html` in your text editor.  
2. Complete the TODO comment:
   - Ensure the `<head>` links to the **styles** CSS file:
     ```html
     <link rel="stylesheet" href="styles.css">
     ```

### Step 2: Complete the CSS TODOs

Open `styles.css` and complete each TODO.

### Step 3: Test Your Page

1. Save `index.html` and `styles.css`.  
2. Open in your browser.  
3. Verify each section updates as you complete TODs.  
4. Hover buttons/links to test interactive styles.

### Step 4: Push your work to Github Classroom

1. `git add .`
2. `git commit -m "3-2-More-CSS-main"`
3. `git push origin main`

## Expected Results

- [ ] **Layout**: Subtle backgrounds, muted tagline, card shadows  
- [ ] **Typography**: Capitalized titles, serif body text, brand links with hover underline  
- [ ] **Box Model**: Three demo boxes with padding, borders, unique looks  
- [ ] **Flexbox**: Evenly spaced toolbar and responsive product grid  
- [ ] **Positioning**: Relative offsets, absolute child badge, fixed viewport badge, stacked squares  

## Understanding the Concepts

* **Variables**: Centralize colors with `:root`  
* **Fonts/Text**: Compare units, transforms, and spacing  
* **Box Model**: Use `box-sizing: border-box` for predictability  
* **Flexbox**: Wrap, align, and size items flexibly  
* **Positioning**: Control flow, offsets, and stacking

## Elements You’ll Style

* **Header & Footer** with muted tagline  
* **Typography section** with titles, intros, links  
* **Box row** with three styled boxes  
* **Flex toolbar & grid** for navigation and items  
* **Positioning stage** for static, relative, absolute, fixed, stacked elements

## Common Patterns

1. Design tokens via CSS variables  
2. Clear visual hierarchy  
3. Interactive feedback (hover states)  
4. Responsive flex layout

## Troubleshooting

* **No styles?** Check CSS `<link>`  
* **Misplaced absolute child?** Ensure parent has `position: relative`  
* **Overlap wrong?** Adjust `z-index`  
* **Grid not wrapping?** Confirm `flex-wrap: wrap` and `flex-basis`

## CSS Resources

* [MDN CSS](https://developer.mozilla.org/)  
* [Flexbox Froggy](https://flexboxfroggy.com/)  
* [Specificity Calculator](https://specificity.keegan.st/)  
* [CSS Zen Garden](https://csszengarden.com/)  

Happy styling! 🎨🧩
