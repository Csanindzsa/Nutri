import React from "react";
import {
  ListItem as MuiListItem,
  ListItemProps,
  Typography as MuiTypography,
  TypographyProps,
} from "@mui/material";

/**
 * Fixed ListItem component that prevents invalid DOM props
 * from being passed to the underlying DOM element.
 */
export const ListItem: React.FC<
  ListItemProps & { indent?: boolean | string }
> = ({ indent, ...rest }) => {
  // Convert boolean indent to string for DOM or use in sx prop
  const indentValue = indent
    ? typeof indent === "boolean"
      ? "true"
      : indent
    : undefined;

  // Use indent as part of sx prop instead of a direct DOM attribute
  const updatedSx = indent
    ? {
        ...rest.sx,
        paddingLeft: typeof indent === "boolean" ? "2rem" : undefined,
      }
    : rest.sx;

  return <MuiListItem {...rest} sx={updatedSx} />;
};

/**
 * Fixed Typography component that prevents invalid DOM props
 */
export const Typography: React.FC<TypographyProps & { noBorder?: boolean }> = ({
  noBorder,
  ...rest
}) => {
  // Convert noBorder to sx prop
  const updatedSx = noBorder
    ? {
        ...rest.sx,
        border: "none",
      }
    : rest.sx;

  return <MuiTypography {...rest} sx={updatedSx} />;
};
