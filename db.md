```mermaid
erDiagram
    User {
        UUID id PK
        string email
        string password
        string first_name
        string last_name
    }

    Transactions {
        UUID id
        int amount
        Date date
        int budget
    }


```
