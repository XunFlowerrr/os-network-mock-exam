import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

const BreadcrumbGenerator = ({
  context,
}: {
  context: { name: string; url: string }[];
}) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {context.map((item, index) => {
          const isLast = index === context.length - 1;
          return (
            <React.Fragment key={index}>
              <BreadcrumbItem className="hidden md:block">
                {isLast ? (
                  <BreadcrumbPage>{item.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.url}>{item.name}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadcrumbGenerator;
