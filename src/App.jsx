import styled from "styled-components";
import GlobalStyles from "./styles/GlobalStyles";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Heading from "./ui/Heading";

const StyledApp = styled.main`
  background-color: orangered;
  padding: 20px;
`;

export default function App() {
  return (
    <>
      <GlobalStyles />
      <StyledApp>
        <Heading as="h1">Think chess</Heading>
        <Heading as="h2">The best in the world!</Heading>
        <div>Hello World!</div>
        <Button>Hey</Button>
        <Input />
      </StyledApp>
    </>
  );
}
