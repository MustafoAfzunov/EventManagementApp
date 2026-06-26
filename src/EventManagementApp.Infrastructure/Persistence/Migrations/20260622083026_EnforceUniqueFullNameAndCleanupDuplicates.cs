using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventManagementApp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EnforceUniqueFullNameAndCleanupDuplicates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ;WITH RankedUsers AS (
                    SELECT
                        Id,
                        ROW_NUMBER() OVER (
                            PARTITION BY LOWER(LTRIM(RTRIM(FirstName))), LOWER(LTRIM(RTRIM(LastName)))
                            ORDER BY CreatedAt
                        ) AS RowNum
                    FROM Users
                )
                DELETE FROM Notifications
                WHERE UserId IN (SELECT Id FROM RankedUsers WHERE RowNum > 1);

                ;WITH RankedUsers AS (
                    SELECT
                        Id,
                        ROW_NUMBER() OVER (
                            PARTITION BY LOWER(LTRIM(RTRIM(FirstName))), LOWER(LTRIM(RTRIM(LastName)))
                            ORDER BY CreatedAt
                        ) AS RowNum
                    FROM Users
                )
                DELETE FROM Registrations
                WHERE UserId IN (SELECT Id FROM RankedUsers WHERE RowNum > 1);

                ;WITH RankedUsers AS (
                    SELECT
                        Id,
                        ROW_NUMBER() OVER (
                            PARTITION BY LOWER(LTRIM(RTRIM(FirstName))), LOWER(LTRIM(RTRIM(LastName)))
                            ORDER BY CreatedAt
                        ) AS RowNum
                    FROM Users
                )
                DELETE FROM Users
                WHERE Id IN (SELECT Id FROM RankedUsers WHERE RowNum > 1);
                """);

            migrationBuilder.Sql("""
                ALTER TABLE Users
                ADD NormalizedFirstName AS LOWER(LTRIM(RTRIM(FirstName))) PERSISTED;

                ALTER TABLE Users
                ADD NormalizedLastName AS LOWER(LTRIM(RTRIM(LastName))) PERSISTED;
                """);

            migrationBuilder.Sql("""
                CREATE UNIQUE INDEX IX_Users_UniqueFullName
                ON Users (NormalizedFirstName, NormalizedLastName);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP INDEX IX_Users_UniqueFullName ON Users;");

            migrationBuilder.Sql("""
                ALTER TABLE Users DROP COLUMN NormalizedLastName;
                ALTER TABLE Users DROP COLUMN NormalizedFirstName;
                """);
        }
    }
}
