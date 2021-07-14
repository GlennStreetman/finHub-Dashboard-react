
import { screen, waitFor, fireEvent } from '@testing-library/react'

const addWidget = async function (category: string, categoryText: string, widgetText: string) { //testFunction(same name), Category, Category text, widget Text
    //add widget to dashboard
    fireEvent.mouseOver(screen.getByTestId('widgetsDropdown'));
    await waitFor(() => {
        expect(screen.getByTestId(category)).toBeInTheDocument() //estimatesDropDown, fundamentalsDropdown, priceDropDown
    })
    fireEvent.mouseOver(screen.getByText(categoryText)); //Estimate, Fundamental, Price
    await waitFor(() => {
        expect(screen.getByTestId(widgetText)).toBeInTheDocument() //copy submenu text
    })
    expect(screen.getByTestId(widgetText)).toBeInTheDocument()
    fireEvent.click(screen.getByTestId(widgetText)) //copy submenu text
}

export { addWidget }