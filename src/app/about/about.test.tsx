import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AboutPage from "./about";

test("renders AboutPage correctly", () => {
  const { asFragment } = render(
    <MemoryRouter>
      <AboutPage />
    </MemoryRouter>,
  );
  expect(asFragment()).toMatchSnapshot();
});
