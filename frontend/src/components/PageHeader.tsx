type Props = {
    title: string
    subtitle?: string
    children?: React.ReactNode   /* action buttons */
}

export function PageHeader({ title, subtitle, children }: Props) {
    return (
        <div className="page-header">
            <div>
                <h1 className="page-title">{title}</h1>
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {children && <div className="flex items-center gap-2">{children}</div>}
        </div>
    )
}
